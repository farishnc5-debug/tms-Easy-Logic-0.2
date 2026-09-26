// Pure role -> capability table (no database/session access, so it is unit-testable).
export type Capability = "admin" | "finance" | "operate" | "field" | "read";

const GRANTS: Record<string, Capability[]> = {
  ADMIN: ["admin", "finance", "operate", "field", "read"],
  OPERATIONS_MANAGER: ["finance", "operate", "field", "read"],
  DISPATCHER: ["operate", "field", "read"],
  DRIVER: ["field", "read"],
  VIEWER: ["read"],
};

export function can(role: string, capability: Capability) {
  return (GRANTS[role] ?? []).includes(capability);
}
