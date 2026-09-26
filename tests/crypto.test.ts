import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

const KEY = "test-key-for-unit-tests";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = KEY;
});

describe("secret encryption", () => {
  it("round-trips a secret and hides the plaintext", () => {
    const enc = encryptSecret('{"accessToken":"abc123"}');
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain("abc123");
    expect(decryptSecret(enc)).toBe('{"accessToken":"abc123"}');
  });

  it("uses a fresh IV each time (same input, different ciphertext)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("passes legacy plaintext through unchanged", () => {
    expect(decryptSecret('{"legacy":true}')).toBe('{"legacy":true}');
  });

  it("detects tampering", () => {
    const enc = encryptSecret("secret");
    const raw = Buffer.from(enc.slice("enc:v1:".length), "base64");
    raw[raw.length - 1] ^= 0xff; // flip bits in the ciphertext
    const bad = "enc:v1:" + raw.toString("base64");
    expect(() => decryptSecret(bad)).toThrow();
  });

  it("cannot be decrypted with a different key", () => {
    const enc = encryptSecret("secret");
    process.env.APP_ENCRYPTION_KEY = "another-key";
    expect(() => decryptSecret(enc)).toThrow();
    process.env.APP_ENCRYPTION_KEY = KEY;
  });
});
