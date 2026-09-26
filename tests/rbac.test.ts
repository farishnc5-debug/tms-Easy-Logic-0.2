import { describe, it, expect } from "vitest";
import { can } from "@/lib/rbac-policy";

describe("role permissions", () => {
  it("only ADMIN can manage users, integrations and API keys", () => {
    expect(can("ADMIN", "admin")).toBe(true);
    for (const role of ["OPERATIONS_MANAGER", "DISPATCHER", "DRIVER", "VIEWER"]) {
      expect(can(role, "admin")).toBe(false);
    }
  });

  it("dispatchers operate but cannot touch finance", () => {
    expect(can("DISPATCHER", "operate")).toBe(true);
    expect(can("DISPATCHER", "finance")).toBe(false);
  });

  it("operations managers get finance but not admin", () => {
    expect(can("OPERATIONS_MANAGER", "finance")).toBe(true);
    expect(can("OPERATIONS_MANAGER", "admin")).toBe(false);
  });

  it("drivers can only do field work (POD, incidents, status)", () => {
    expect(can("DRIVER", "field")).toBe(true);
    expect(can("DRIVER", "operate")).toBe(false);
    expect(can("DRIVER", "finance")).toBe(false);
  });

  it("viewers are read-only", () => {
    expect(can("VIEWER", "read")).toBe(true);
    for (const cap of ["admin", "finance", "operate", "field"] as const) {
      expect(can("VIEWER", cap)).toBe(false);
    }
  });

  it("unknown roles get nothing (fail closed)", () => {
    expect(can("HACKER", "read")).toBe(false);
    expect(can("", "read")).toBe(false);
  });
});
