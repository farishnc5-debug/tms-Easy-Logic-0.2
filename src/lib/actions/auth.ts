"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { countRecentFailures, recordFailure, clearFailures } from "@/lib/login-throttle";
import { isLockedOut, WINDOW_MINUTES } from "@/lib/login-policy";

export type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const keys = [`email:${email}`, `ip:${ip}`];

  if (isLockedOut(await countRecentFailures(keys))) {
    return { error: `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.` };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Always run the password check (even for unknown emails) so response time
  // doesn't reveal whether an account exists.
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid.");
  if (!user || !user.active || !valid) {
    await recordFailure(keys);
    return { error: "Invalid email or password." };
  }
  await clearFailures(keys);

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
