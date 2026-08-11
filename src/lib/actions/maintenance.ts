"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { FAW_PLAN } from "@/lib/maintenance-plan";

// Update a truck's odometer reading (manual entry now; the GPS platform's
// odometer will overwrite this automatically once the API key is connected).
export async function updateOdometer(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const km = Number(formData.get("odometerKm"));
  if (!vehicleId || Number.isNaN(km) || km < 0) {
    throw new Error("A valid odometer reading is required.");
  }
  const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (vehicle.odometerKm != null && km < vehicle.odometerKm) {
    throw new Error(
      `New reading (${km.toLocaleString()} km) is lower than the current odometer (${vehicle.odometerKm.toLocaleString()} km).`,
    );
  }
  await db.vehicle.update({
    where: { id: vehicleId },
    data: { odometerKm: km, odometerUpdatedAt: new Date() },
  });
  revalidatePath("/maintenance");
}

// Record a completed service. This resets the interval counter for that PM
// level — the next due km is computed from this record.
export async function logService(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const serviceCode = String(formData.get("serviceCode") ?? "");
  const odometerKm = Number(formData.get("odometerKm"));
  const workshop = String(formData.get("workshop") ?? "").trim() || null;
  const costSar = formData.get("costSar") ? Number(formData.get("costSar")) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!vehicleId || Number.isNaN(odometerKm) || odometerKm < 0) {
    throw new Error("Vehicle and odometer km are required.");
  }
  if (!FAW_PLAN.some((p) => p.code === serviceCode)) {
    throw new Error("Unknown service type.");
  }

  const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });

  await db.maintenanceRecord.create({
    data: { vehicleId, serviceCode, odometerKm, workshop, costSar, notes },
  });

  // A service visit also implies an up-to-date odometer reading
  if (vehicle.odometerKm == null || odometerKm > vehicle.odometerKm) {
    await db.vehicle.update({
      where: { id: vehicleId },
      data: { odometerKm, odometerUpdatedAt: new Date() },
    });
  }

  await logAudit({
    action: "SERVICE_LOGGED",
    entity: "Vehicle",
    entityId: vehicleId,
    entityRef: vehicle.plateNumber,
    after: { serviceCode, odometerKm, workshop, costSar },
  });

  revalidatePath("/maintenance");
}

export async function deleteServiceRecord(recordId: string) {
  const rec = await db.maintenanceRecord.delete({
    where: { id: recordId },
    include: { vehicle: { select: { plateNumber: true } } },
  });
  await logAudit({
    action: "SERVICE_RECORD_DELETED",
    entity: "Vehicle",
    entityId: rec.vehicleId,
    entityRef: rec.vehicle.plateNumber,
    before: { serviceCode: rec.serviceCode, odometerKm: rec.odometerKm },
  });
  revalidatePath("/maintenance");
}
