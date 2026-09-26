"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCompanyProfile } from "@/lib/company";

function str(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

export async function updateCompanyProfile(formData: FormData) {
  await requireCapability("admin");
  const profile = await getCompanyProfile();

  await db.companyProfile.update({
    where: { id: profile.id },
    data: {
      name: str(formData, "name") ?? profile.name,
      nameAr: str(formData, "nameAr"),
      tagline: str(formData, "tagline"),
      crNumber: str(formData, "crNumber"),
      vatNumber: str(formData, "vatNumber"),
      phone: str(formData, "phone"),
      phone2: str(formData, "phone2"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      address: str(formData, "address"),
      streetName: str(formData, "streetName"),
      buildingNumber: str(formData, "buildingNumber"),
      district: str(formData, "district"),
      postalCode: str(formData, "postalCode"),
      city: str(formData, "city"),
      country: str(formData, "country"),
      bankName: str(formData, "bankName"),
      bankAccount: str(formData, "bankAccount"),
      bankIban: str(formData, "bankIban"),
      bankBeneficiary: str(formData, "bankBeneficiary"),
    },
  });

  revalidatePath("/company");
  redirect("/company?saved=1");
}
