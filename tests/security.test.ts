import crypto from "crypto";
import { describe, it, expect } from "vitest";
import { isLockedOut, MAX_FAILURES } from "@/lib/login-policy";
import { validSignature } from "@/lib/webhook-signature";
import { hasScope } from "@/lib/api-key-scope";

describe("login lockout", () => {
  it("locks at the threshold, not before", () => {
    expect(isLockedOut(MAX_FAILURES - 1)).toBe(false);
    expect(isLockedOut(MAX_FAILURES)).toBe(true);
    expect(isLockedOut(MAX_FAILURES + 10)).toBe(true);
  });
});

describe("WhatsApp webhook signature", () => {
  const secret = "app-secret";
  const body = '{"entry":[]}';
  const good = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a correctly signed body", () => {
    expect(validSignature(body, good, secret)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(validSignature(body + " ", good, secret)).toBe(false);
  });
  it("rejects wrong secret, missing header, and wrong scheme", () => {
    expect(validSignature(body, good, "other")).toBe(false);
    expect(validSignature(body, null, secret)).toBe(false);
    expect(validSignature(body, "md5=abc", secret)).toBe(false);
    expect(validSignature(body, "sha256=short", secret)).toBe(false);
  });
});

describe("API key scopes", () => {
  it("matches exact scopes only", () => {
    expect(hasScope("shipments:read,trips:read", "trips:read")).toBe(true);
    expect(hasScope("shipments:read", "shipments:write")).toBe(false);
    expect(hasScope("shipments:read", "shipments")).toBe(false);
    expect(hasScope("", "shipments:read")).toBe(false);
  });
});
