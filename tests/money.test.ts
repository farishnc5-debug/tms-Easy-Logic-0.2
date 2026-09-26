import { describe, it, expect } from "vitest";
import { totalsOf, roundMoney, parseVatPct, DEFAULT_VAT_PCT } from "@/lib/money";

describe("totalsOf", () => {
  it("charges 15% VAT on freight", () => {
    expect(totalsOf(3500, 15)).toEqual({ subtotal: 3500, vat: 525, total: 4025 });
  });

  it("applies VAT to freight PLUS extra charges (waiting time, detention)", () => {
    const t = totalsOf(3500, 15, [200, 100]);
    expect(t.subtotal).toBe(3800);
    expect(t.vat).toBe(570);
    expect(t.total).toBe(4370);
  });

  it("rounds to halalas so printed lines always add up", () => {
    const t = totalsOf(333.33, 15);
    expect(t.vat).toBe(50);
    expect(roundMoney(t.subtotal + t.vat)).toBe(t.total);
  });

  it("handles 0% VAT (exempt)", () => {
    expect(totalsOf(1000, 0).total).toBe(1000);
  });

  it("does not drift on classic float cases", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });
});

describe("parseVatPct", () => {
  it("defaults to 15 when blank or missing", () => {
    expect(parseVatPct("")).toBe(DEFAULT_VAT_PCT);
    expect(parseVatPct(null)).toBe(DEFAULT_VAT_PCT);
    expect(parseVatPct("  ")).toBe(DEFAULT_VAT_PCT);
  });
  it("accepts valid values including 0", () => {
    expect(parseVatPct("0")).toBe(0);
    expect(parseVatPct("5")).toBe(5);
    expect(parseVatPct("15")).toBe(15);
  });
  it("rejects negative, huge, and non-numeric input", () => {
    expect(() => parseVatPct("-5")).toThrow();
    expect(() => parseVatPct("150")).toThrow();
    expect(() => parseVatPct("abc")).toThrow();
  });
});
