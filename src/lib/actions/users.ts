"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, getCurrentUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateUserState = { error?: string } | null;

// Returns an error string for inline display instead of crashing the page.
export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "VIEWER");
  const title = String(formData.get("title") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name || !email || password.length < 6) {
    return { error: "Name, email and a password of 6+ characters are required." };
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
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "VIEWER");
  const title = String(formData.get("title") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  const password = String(formData.get("password") ?? "");

  await db.user.update({
    where: { id },
    data: {
      name,
      role,
      title,
      phone,
      active,
      ...(password.length >= 6 ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  redirect(`/users/${id}`);
}

export async function deleteUser(id: string) {
  const current = await getCurrentUser();
  if (current?.id === id) throw new Error("You cannot delete your own account.");
  await db.session.deleteMany({ where: { userId: id } });
  await db.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users");
}
