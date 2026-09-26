// Pre-flight checks so users get a clear, specific message instead of a cryptic
// ZATCA rejection. These mirror ZATCA's own field rules.

// Saudi VAT numbers are 15 digits, starting and ending with 3.
export function validateVatNumber(vat: string | null | undefined): boolean {
  return !!vat && /^3\d{13}3$/.test(vat.trim());
}

export function validateSellerVat(vat: string | null | undefined, label = "Company profile VAT number"): string[] {
  if (!vat) return [`${label} is missing.`];
  if (!validateVatNumber(vat)) return [`${label} must be 15 digits, starting and ending with 3.`];
  return [];
}

type Address = {
  street?: string | null;
  buildingNumber?: string | null;
  district?: string | null;
  city?: string | null;
  postalCode?: string | null;
};

export function validateParty(label: string, a: Address): string[] {
  const out: string[] = [];
  if (!a.street?.trim()) out.push(`${label}: street name is missing.`);
  if (!a.buildingNumber || !/^\d{4}$/.test(a.buildingNumber.trim())) out.push(`${label}: building number must be 4 digits.`);
  if (!a.district?.trim()) out.push(`${label}: district is missing.`);
  if (!a.city?.trim()) out.push(`${label}: city is missing.`);
  if (!a.postalCode || !/^\d{5}$/.test(a.postalCode.trim())) out.push(`${label}: postal code must be 5 digits.`);
  return out;
}
