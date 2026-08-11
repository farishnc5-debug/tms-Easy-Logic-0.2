"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { genCode } from "@/lib/constants";

async function nextQuotationCode() {
  const rows = await db.quotation.findMany({ select: { code: true } });
  let max = 0;
  for (const { code } of rows) {
    const m = code.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return genCode("QT", max + 1, 4);
}

export async function createQuotation(formData: FormData) {
  const manualMode = String(formData.get("manualMode") ?? "") === "1";
  const customerId = String(formData.get("customerId") ?? "").trim() || null;
  const manualCustomerName = String(formData.get("manualCustomerName") ?? "").trim() || null;
  const manualCustomerCompany = String(formData.get("manualCustomerCompany") ?? "").trim() || null;
  const manualCustomerPhone = String(formData.get("manualCustomerPhone") ?? "").trim() || null;
  const manualCustomerAddress = String(formData.get("manualCustomerAddress") ?? "").trim() || null;
  const originName = String(formData.get("originName") ?? "").trim();
  const destinationName = String(formData.get("destinationName") ?? "").trim();
  const tripType = String(formData.get("tripType") ?? "ONE_WAY");
  const vehicleType = String(formData.get("vehicleType") ?? "").trim() || null;
  const cargoDescription = String(formData.get("cargoDescription") ?? "").trim() || null;
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const priceAmount = Number(formData.get("priceAmount") ?? 0);
  const vatPct = formData.get("vatPct") !== null && formData.get("vatPct") !== ""
    ? Number(formData.get("vatPct"))
    : 15;
  const validDays = Number(formData.get("validDays") ?? 15);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!originName || !destinationName || !priceAmount) {
    throw new Error("Route and price are required.");
  }
  if (manualMode && !manualCustomerName) {
    throw new Error("Enter at least the customer's name for a manual quotation.");
  }
  if (!manualMode && !customerId) {
    throw new Error("Select a customer, or switch to manual entry.");
  }

  const quotation = await db.quotation.create({
    data: {
      code: await nextQuotationCode(),
      customerId: manualMode ? null : customerId,
      manualCustomerName: manualMode ? manualCustomerName : null,
      manualCustomerCompany: manualMode ? manualCustomerCompany : null,
      manualCustomerPhone: manualMode ? manualCustomerPhone : null,
      manualCustomerAddress: manualMode ? manualCustomerAddress : null,
      originName,
      destinationName,
      tripType,
      vehicleType,
      cargoDescription,
      weightKg: weightKg ?? undefined,
      priceAmount,
      vatPct,
      validUntil: new Date(Date.now() + validDays * 86400000),
      notes,
      status: "DRAFT",
    },
  });

  revalidatePath("/quotations");
  redirect(`/quotations/${quotation.id}`);
}

export async function updateQuotationStatus(id: string, status: string) {
  await db.quotation.update({ where: { id }, data: { status } });
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
}

export async function deleteQuotation(id: string) {
  await db.quotation.delete({ where: { id } });
  revalidatePath("/quotations");
  redirect("/quotations");
}
