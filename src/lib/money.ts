// Money maths for quotations and invoices. Amounts are SAR; VAT is charged on
// the sum of freight + all extra charges. Everything is rounded to 2 decimals
// (halalas) at each step so printed line items always add up to the total.
export const DEFAULT_VAT_PCT = 15;

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Accepts raw form input; falls back to the default when blank/invalid and
// rejects out-of-range values so a typo can't produce a nonsense invoice.
export function parseVatPct(raw: FormDataEntryValue | null | undefined): number {
  if (raw === null || raw === undefined || String(raw).trim() === "") return DEFAULT_VAT_PCT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error("VAT % must be a number between 0 and 100.");
  }
  return n;
}

export function totalsOf(freight: number, vatPct: number, charges: number[] = []) {
  const subtotal = roundMoney(freight + charges.reduce((s, c) => s + c, 0));
  const vat = roundMoney((subtotal * vatPct) / 100);
  return { subtotal, vat, total: roundMoney(subtotal + vat) };
}
