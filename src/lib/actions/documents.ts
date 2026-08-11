"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as File | null;
  const shipmentId = String(formData.get("shipmentId") ?? "") || null;
  const tripId = String(formData.get("tripId") ?? "") || null;

  if (!file || file.size === 0) throw new Error("Please choose a file to upload.");

  // Stored on disk; only the serving path goes into the database
  const dataUrl = await saveUpload(file, "documents");
  const user = await getCurrentUser();

  await db.document.create({
    data: {
      name: file.name,
      fileType: file.type || "application/octet-stream",
      dataUrl,
      sizeKb: Math.round((file.size / 1024) * 10) / 10,
      shipmentId,
      tripId,
      uploadedById: user?.id,
    },
  });

  revalidatePath("/documents");
  if (shipmentId) revalidatePath(`/shipments/${shipmentId}`);
  if (tripId) revalidatePath(`/trips/${tripId}`);
}

export async function deleteDocument(id: string) {
  const doc = await db.document.delete({ where: { id } });
  revalidatePath("/documents");
  if (doc.shipmentId) revalidatePath(`/shipments/${doc.shipmentId}`);
  if (doc.tripId) revalidatePath(`/trips/${doc.tripId}`);
}
