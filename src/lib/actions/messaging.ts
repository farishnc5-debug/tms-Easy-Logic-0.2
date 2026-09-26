"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/integrations-server";
import { requireCapability } from "@/lib/rbac";

export async function listTripMessages(shipmentId: string) {
  await requireCapability("read");
  return db.whatsAppMessage.findMany({
    where: { shipmentId },
    orderBy: { createdAt: "desc" },
  });
}

// Sends a WhatsApp message to the trip's driver or the shipment's customer.
// When "includeLocation" is set, appends a plain Google Maps link built from
// the vehicle's latest known GPS position — no Google Maps API key needed,
// this is just a maps.google.com URL that opens in the Maps app/website.
export async function sendTripWhatsAppMessage(tripId: string, formData: FormData) {
  await requireCapability("operate");
  const recipient = String(formData.get("recipient") ?? ""); // "driver" | "customer"
  const message = String(formData.get("message") ?? "").trim();
  const includeLocation = formData.get("includeLocation") === "1";
  if (!message) throw new Error("Write a message first.");

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: { driver: true, vehicle: true, shipment: { include: { customer: true } } },
  });
  if (!trip) throw new Error("Trip not found.");

  const to =
    recipient === "driver"
      ? (trip.driver?.phone ?? trip.manualDriverPhone)
      : trip.shipment.customer.phone;
  if (!to) throw new Error(`No phone number on file for the ${recipient}.`);

  let body = message;
  if (includeLocation && trip.vehicleId) {
    const loc = await db.vehicleLocation.findFirst({
      where: { vehicleId: trip.vehicleId },
      orderBy: { timestamp: "desc" },
    });
    if (loc) {
      body += `\n\nLive location: https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    } else {
      body += "\n\n(No live GPS location on file for this vehicle yet.)";
    }
  }

  const result = await sendWhatsAppMessage(to, body, trip.shipmentId);
  revalidatePath(`/trips/${tripId}`);
  return result;
}
