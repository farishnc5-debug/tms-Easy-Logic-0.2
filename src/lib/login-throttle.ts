import { db } from "@/lib/db";
import { WINDOW_MINUTES } from "@/lib/login-policy";

// Lock a sign-in target after too many recent failures. Tracked per email
// (stops guessing one account from many IPs) and per IP (stops one machine
// trying many accounts).
function since() {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000);
}

export async function countRecentFailures(keys: string[]) {
  const counts = await Promise.all(
    keys.map((key) => db.loginAttempt.count({ where: { key, createdAt: { gte: since() } } })),
  );
  return Math.max(...counts);
}

export async function recordFailure(keys: string[]) {
  await db.loginAttempt.createMany({ data: keys.map((key) => ({ key })) });
}

export async function clearFailures(keys: string[]) {
  await db.loginAttempt.deleteMany({ where: { key: { in: keys } } });
  // opportunistic cleanup of old rows
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
}
