"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ROLES } from "@/lib/constants";

const MIN_PASSWORD = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateUserState = { error?: string } | null;

// Returns an error string for inline display instead of crashing the page.
export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireCapability("admin");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "VIEWER");
  const title = String(formData.get("title") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name || !email || password.length < MIN_PASSWORD) {
    return { error: "Name, email and a password of 8+ characters are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // Friendly duplicate-email check before hitting the unique constraint
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: `A user with the email "${email}" already exists. Please use a different email.` };
  }

  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await db.user.create({
      data: { name, email, passwordHash, role, title, phone },
    });
  } catch (err) {
    // Handles a rare race where the email was taken between the check and insert
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `A user with the email "${email}" already exists. Please use a different email.` };
    }
    throw err;
  }

  revalidatePath("/users");
  redirect(`/users/${user.id}`);
}

export async function updateUser(id: string, formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor) throw new Error("UNAUTHENTICATED");
  const isAdmin = can(actor.role, "admin");
  // Only admins may edit other people; nobody but an admin may change roles or
  // (de)activate accounts — otherwise any user could promote themselves.
  if (!isAdmin && actor.id !== id) throw new Error("FORBIDDEN: you can only edit your own profile.");

  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  if (password && password.length < MIN_PASSWORD) {
    throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
  }
  if (!name) throw new Error("Name is required.");

  let adminFields = {};
  if (isAdmin) {
    const role = String(formData.get("role") ?? "VIEWER");
    const active = formData.get("active") === "on";
    if (!ROLES.includes(role as (typeof ROLES)[number])) throw new Error("Invalid role.");
    // Never let the last admin lock everyone out (demote or deactivate self)
    if (actor.id === id && (role !== "ADMIN" || !active)) {
      throw new Error("You cannot remove your own admin access or deactivate yourself.");
    }
    adminFields = { role, active };
  }

  await db.user.update({
    where: { id },
    data: {
      name,
      title,
      phone,
      ...adminFields,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });
  // When an admin resets someone else's password or deactivates them, end that
  // user's sessions so the change takes effect immediately.
  const deactivated = "active" in adminFields && !(adminFields as { active: boolean }).active;
  if (actor.id !== id && (password || deactivated)) {
    await db.session.deleteMany({ where: { userId: id } });
  }

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  redirect(isAdmin ? `/users/${id}` : "/settings");
}

export async function deleteUser(id: string) {
  await requireCapability("admin");
  const current = await getCurrentUser();
  if (current?.id === id) throw new Error("You cannot delete your own account.");
  await db.session.deleteMany({ where: { userId: id } });
  await db.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users");
}
