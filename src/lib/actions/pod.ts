"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import { updateTripStatus } from "@/lib/actions/trips";

export async function createPod(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const receivedBy = String(formData.get("receivedBy") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const photo = formData.get("photo") as File | null;

  if (!shipmentId || !receivedBy) throw new Error("Shipment and receiver name are required.");

  let photoDataUrl: string | null = null;
  if (photo && photo.size > 0) {
    // Photo stored on disk; the DB keeps only the serving path
    photoDataUrl = await saveUpload(photo, "pod");
  }

  await db.proofOfDelivery.create({
    data: { shipmentId, receivedBy, notes, photoDataUrl },
  });

  // Advance the trip through the canonical status logic so POD upload behaves
  // exactly like pressing "Advance to Delivered": correct round-trip handling
  // (driver stays on the return leg), settlement creation, audit trail.
  // Trips already at/past DELIVERED (e.g. on the empty-return leg) are left alone.
  const trip = await db.trip.findUnique({ where: { shipmentId } });
  const preDelivery = ["PENDING", "DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "DELAYED"];
  if (trip && preDelivery.includes(trip.status)) {
    await updateTripStatus(trip.id, "DELIVERED");
  } else if (!trip) {
    // POD without a dispatched trip: record delivery on the shipment directly
    await db.shipment.update({
      where: { id: shipmentId },
      data: { status: "DELIVERED", cycleStage: 5 },
    });
  }

  revalidatePath("/pod");
  revalidatePath("/shipments");
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect(`/shipments/${shipmentId}`);
}
