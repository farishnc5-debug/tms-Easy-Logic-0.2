"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/storage";

const MAX_DOC_BYTES = 7 * 1024 * 1024; // keep under the 10mb server-action body limit

// Saves an uploaded certificate to disk storage; returns undefined when no new
// file was chosen so existing attachments are preserved on edit.
async function readDoc(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`${key === "crDoc" ? "CR" : "VAT"} attachment is too large (max 7 MB).`);
  }
  const url = await saveUpload(file, "customers");
  return { name: file.name, dataUrl: url };
}

// Parse the agreed lane rates serialized by the RatesEditor component
function readRates(formData: FormData) {
  const raw = String(formData.get("ratesJson") ?? "").trim();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as {
      originName?: string;
      destinationName?: string;
      tripType?: string;
      rateAmount?: string | number;
    }[];
    return arr
      .map((r) => ({
        originName: String(r.originName ?? "").trim(),
        destinationName: String(r.destinationName ?? "").trim(),
        tripType: r.tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY",
        rateAmount: Number(r.rateAmount),
      }))
      .filter((r) => r.originName && r.destinationName && r.rateAmount > 0);
  } catch {
    return [];
  }
}

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    nameAr: String(formData.get("nameAr") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    contactPerson: String(formData.get("contactPerson") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    crNumber: String(formData.get("crNumber") ?? "").trim() || null,
    vatNumber: String(formData.get("vatNumber") ?? "").trim() || null,
    paymentTerms: String(formData.get("paymentTerms") ?? "CASH") === "CREDIT" ? "CREDIT" : "CASH",
    creditDays: formData.get("creditDays") ? Number(formData.get("creditDays")) : null,
  };
}

export async function createCustomer(isVendor: boolean, formData: FormData) {
  const fields = readFields(formData);
  if (!fields.name || !fields.phone) throw new Error("Name and phone are required.");

  const [crDoc, vatDoc] = await Promise.all([
    readDoc(formData, "crDoc"),
    readDoc(formData, "vatDoc"),
  ]);

  const customer = await db.customer.create({
    data: {
      ...fields,
      isVendor,
      crDocName: crDoc?.name,
      crDocDataUrl: crDoc?.dataUrl,
      vatDocName: vatDoc?.name,
      vatDocDataUrl: vatDoc?.dataUrl,
      rates: { create: readRates(formData) },
    },
  });

  const base = isVendor ? "/vendors" : "/customers";
  revalidatePath(base);
  redirect(`${base}/${customer.id}`);
}

export async function updateCustomer(id: string, isVendor: boolean, formData: FormData) {
  const fields = readFields(formData);

  const [crDoc, vatDoc] = await Promise.all([
    readDoc(formData, "crDoc"),
    readDoc(formData, "vatDoc"),
  ]);

  await db.customer.update({
    where: { id },
    data: {
      ...fields,
      // only replace attachments when a new file was actually uploaded
      ...(crDoc ? { crDocName: crDoc.name, crDocDataUrl: crDoc.dataUrl } : {}),
      ...(vatDoc ? { vatDocName: vatDoc.name, vatDocDataUrl: vatDoc.dataUrl } : {}),
      // replace the agreed rate card with the submitted rows
      rates: { deleteMany: {}, create: readRates(formData) },
    },
  });

  const base = isVendor ? "/vendors" : "/customers";
  revalidatePath(base);
  revalidatePath(`${base}/${id}`);
  redirect(`${base}/${id}`);
}

export async function deleteCustomer(id: string, isVendor: boolean) {
  await db.customer.delete({ where: { id } });
  const base = isVendor ? "/vendors" : "/customers";
  revalidatePath(base);
  redirect(base);
}
