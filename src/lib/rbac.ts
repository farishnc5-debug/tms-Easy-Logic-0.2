import { getCurrentUser } from "@/lib/auth";
import { can, type Capability } from "@/lib/rbac-policy";

// Role-based access control. Every server action and API route must call
// one of the require* helpers — the proxy only checks that a cookie exists,
// it does not prove who the caller is or what they may do.
//
//   admin    — users, company profile, integrations, API keys, GPS setup
//   finance  — payment follow-up, invoices, tariff book, trip money payout
//   operate  — bookings, dispatch, trips, customers, quotations, fleet, tasks
//   field    — proof of delivery, incidents, trip status updates, documents
//   read     — view only (every signed-in user)
export type { Capability } from "@/lib/rbac-policy";
export { can } from "@/lib/rbac-policy";

// Returns the signed-in, active user or throws.
export async function requireCapability(capability: Capability) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!can(user.role, capability)) throw new Error("FORBIDDEN: your role is not allowed to do this.");
  return user;
}
