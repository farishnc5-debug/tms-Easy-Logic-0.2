import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can, type Capability } from "@/lib/rbac";

// For server-component pages: send signed-out users to login and users
// without the needed capability back to the dashboard.
export async function requirePageCapability(capability: Capability) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, capability)) redirect("/dashboard");
  return user;
}
