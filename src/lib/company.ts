import { db } from "@/lib/db";

// Single-row accessor; creates an empty profile on first use so forms always have a target
export async function getCompanyProfile() {
  const existing = await db.companyProfile.findFirst();
  if (existing) return existing;
  return db.companyProfile.create({
    data: { name: "Your Company Name" },
  });
}
