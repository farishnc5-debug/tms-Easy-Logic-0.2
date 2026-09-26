"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { genCode, coordFor, VEHICLE_TYPES, isColdSelection } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

// Codes must survive deletions, so derive the next sequence from the highest
// existing numeric suffix rather than the row count.
async function nextShipmentCode() {
  const rows = await db.shipment.findMany({ select: { code: true } });
  let max = 117;
  for (const { code } of rows) {
    const m = code.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return genCode("SHP", max + 1);
}

async function nextTripCode() {
  const rows = await db.trip.findMany({ select: { code: true } });
  let max = 117;
  for (const { code } of rows) {
    const m = code.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return genCode("TRP", max + 1, 6);
}

function numOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

// Equipment + temperature requested on the booking. Cold units must carry a
// valid temperature range (min <= max).
function readEquipment(formData: FormData) {
  const codes = String(formData.get("vehicleTypes") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => VEHICLE_TYPES.some((v) => v.code === c));

  const cold = isColdSelection(codes);
  const minRaw = String(formData.get("tempMinC") ?? "").trim();
  const maxRaw = String(formData.get("tempMaxC") ?? "").trim();
  let tempMinC: number | null = null;
  let tempMaxC: number | null = null;

  if (cold) {
    if (!minRaw || !maxRaw) {
      throw new Error(
        "A temperature range is required for refrigerated/frozen equipment.",
      );
    }
    tempMinC = Number(minRaw);
    tempMaxC = Number(maxRaw);
    if (Number.isNaN(tempMinC) || Number.isNaN(tempMaxC)) {
      throw new Error("Temperature values must be numbers.");
    }
    if (tempMinC > tempMaxC) {
      throw new Error("Minimum temperature cannot be higher than the maximum.");
    }
  }

  return {
    vehicleTypes: codes.length > 0 ? codes.join(",") : null,
    tempMinC,
    tempMaxC,
  };
}

// Additional delivery points inside the destination city
function readStops(formData: FormData) {
  const raw = String(formData.get("stopsJson") ?? "").trim();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Record<string, string>[];
    return arr
      .map((s, i) => ({
        seq: i + 1,
        name: String(s.name ?? "").trim(),
        address: String(s.address ?? "").trim() || null,
        contactName: String(s.contactName ?? "").trim() || null,
        contactPhone: String(s.contactPhone ?? "").trim() || null,
        notes: String(s.notes ?? "").trim() || null,
      }))
      .filter((s) => s.name);
  } catch {
    return [];
  }
}

// If the customer has an agreed rate card, the booking MUST match one of its
// lanes; the rate is snapshotted from the DB (never trusted from the form).
async function resolveAgreedRate(
  customerId: string,
  originName: string,
  destinationName: string,
  tripType: string,
) {
  const rates = await db.customerRate.findMany({ where: { customerId } });
  if (rates.length === 0) return { agreedRate: null }; // no rate card — free entry allowed
  const lane = rates.find(
    (r) =>
      r.originName === originName &&
      r.destinationName === destinationName &&
      r.tripType === tripType,
  );
  if (!lane) {
    throw new Error(
      "This customer has an agreed rate card — bookings are limited to the agreed lanes. Add the lane to the customer's rates first.",
    );
  }
  return { agreedRate: lane.rateAmount };
}

export async function createShipment(formData: FormData) {
  await requireCapability("operate");
  const customerId = String(formData.get("customerId") ?? "");
  const originName = String(formData.get("originName") ?? "").trim();
  const destinationName = String(formData.get("destinationName") ?? "").trim();
  const priority = String(formData.get("priority") ?? "STANDARD");
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const tripType = String(formData.get("tripType") ?? "ONE_WAY") === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
  const returnName = String(formData.get("returnName") ?? "").trim() || null;

  if (!customerId || !originName || !destinationName) {
    throw new Error("Customer, origin and destination are required.");
  }
  if (tripType === "ROUND_TRIP" && !returnName) {
    throw new Error("Round trips require an empty return location.");
  }
  const { agreedRate } = await resolveAgreedRate(customerId, originName, destinationName, tripType);
  const equipment = readEquipment(formData);
  const stops = readStops(formData);

  const shipment = await db.shipment.create({
    data: {
      code: await nextShipmentCode(),
      customerId,
      originName,
      destinationName,
      tripType,
      agreedRate,
      ...equipment,
      stops: { create: stops },
      returnName: tripType === "ROUND_TRIP" ? returnName : null,
      priority,
      status: "PENDING",
      cycleStage: 0,
      weightKg: weightKg ?? undefined,
      notes: notes ?? undefined,
      originAddress: String(formData.get("originAddress") ?? "").trim() || null,
      destinationAddress: String(formData.get("destinationAddress") ?? "").trim() || null,
      returnAddress:
        tripType === "ROUND_TRIP"
          ? String(formData.get("returnAddress") ?? "").trim() || null
          : null,
      originX: numOrNull(formData, "originX"),
      originY: numOrNull(formData, "originY"),
      destX: numOrNull(formData, "destX"),
      destY: numOrNull(formData, "destY"),
      returnX: tripType === "ROUND_TRIP" ? numOrNull(formData, "returnX") : null,
      returnY: tripType === "ROUND_TRIP" ? numOrNull(formData, "returnY") : null,
    },
  });

  revalidatePath("/shipments");
  revalidatePath("/dashboard");
  redirect(`/shipments/${shipment.id}`);
}

export async function updateShipment(id: string, formData: FormData) {
  await requireCapability("operate");
  // Bookings are locked once a driver is dispatched — only cancellation is allowed
  const existingTrip = await db.trip.findUnique({ where: { shipmentId: id } });
  if (existingTrip) {
    redirect(`/shipments/${id}?locked=1`);
  }

  const customerId = String(formData.get("customerId") ?? "");
  const originName = String(formData.get("originName") ?? "").trim();
  const destinationName = String(formData.get("destinationName") ?? "").trim();
  const priority = String(formData.get("priority") ?? "STANDARD");
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const tripType = String(formData.get("tripType") ?? "ONE_WAY") === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
  const returnName = String(formData.get("returnName") ?? "").trim() || null;
  if (tripType === "ROUND_TRIP" && !returnName) {
    throw new Error("Round trips require an empty return location.");
  }
  const { agreedRate } = customerId
    ? await resolveAgreedRate(customerId, originName, destinationName, tripType)
    : { agreedRate: null };

  await db.shipment.update({
    where: { id },
    data: {
      customerId: customerId || undefined,
      originName: originName || undefined,
      destinationName: destinationName || undefined,
      tripType,
      agreedRate,
      ...readEquipment(formData),
      // replace the extra delivery points with the submitted list
      stops: { deleteMany: {}, create: readStops(formData) },
      returnName: tripType === "ROUND_TRIP" ? returnName : null,
      priority,
      weightKg: weightKg ?? undefined,
      notes,
      originAddress: String(formData.get("originAddress") ?? "").trim() || null,
      destinationAddress: String(formData.get("destinationAddress") ?? "").trim() || null,
      returnAddress:
        tripType === "ROUND_TRIP"
          ? String(formData.get("returnAddress") ?? "").trim() || null
          : null,
      originX: numOrNull(formData, "originX"),
      originY: numOrNull(formData, "originY"),
      destX: numOrNull(formData, "destX"),
      destY: numOrNull(formData, "destY"),
      returnX: tripType === "ROUND_TRIP" ? numOrNull(formData, "returnX") : null,
      returnY: tripType === "ROUND_TRIP" ? numOrNull(formData, "returnY") : null,
    },
  });

  revalidatePath("/shipments");
  revalidatePath(`/shipments/${id}`);
  redirect(`/shipments/${id}`);
}

export async function deleteShipment(id: string) {
  await requireCapability("operate");
  const doomed = await db.shipment.findUnique({ where: { id }, select: { code: true, status: true } });
  await logAudit({
    action: "SHIPMENT_DELETED",
    entity: "Shipment",
    entityId: id,
    entityRef: doomed?.code,
    before: { code: doomed?.code, status: doomed?.status },
  });
  await db.incident.updateMany({
    where: { trip: { shipmentId: id } },
    data: { tripId: null },
  });
  await db.document.deleteMany({ where: { shipmentId: id } });
  await db.proofOfDelivery.deleteMany({ where: { shipmentId: id } });
  const trip = await db.trip.findUnique({ where: { shipmentId: id } });
  if (trip) {
    await db.document.deleteMany({ where: { tripId: trip.id } });
    await db.incident.deleteMany({ where: { tripId: trip.id } });
    await db.trip.delete({ where: { id: trip.id } });
  }
  await db.shipment.delete({ where: { id } });

  revalidatePath("/shipments");
  revalidatePath("/trips");
  redirect("/shipments");
}

export async function dispatchShipment(formData: FormData) {
  await requireCapability("operate");
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const manualMode = String(formData.get("manualMode") ?? "") === "1";
  const driverId = String(formData.get("driverId") ?? "");
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const manualDriverName = String(formData.get("manualDriverName") ?? "").trim();
  const manualDriverPhone = String(formData.get("manualDriverPhone") ?? "").trim();
  const manualVehicle = String(formData.get("manualVehicle") ?? "").trim();
  const allowanceRaw = String(formData.get("driverAllowance") ?? "").trim();
  const driverAllowance = allowanceRaw ? Number(allowanceRaw) : null;

  if (!shipmentId) throw new Error("Shipment is required.");
  if (manualMode) {
    if (!manualDriverName || !manualDriverPhone || !manualVehicle) {
      throw new Error("Driver name, phone and truck are required for manual dispatch.");
    }
  } else if (!driverId || !vehicleId) {
    throw new Error("Driver and vehicle are required to dispatch.");
  }

  const shipment = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  // Prefer the booking's dropped pins; fall back to placing by location name
  const origin =
    shipment.originX != null && shipment.originY != null
      ? { x: shipment.originX, y: shipment.originY }
      : coordFor(shipment.originName);
  const dest =
    shipment.destX != null && shipment.destY != null
      ? { x: shipment.destX, y: shipment.destY }
      : coordFor(shipment.destinationName);
  // Round trips also carry the empty-return leg
  const roundTrip = shipment.tripType === "ROUND_TRIP" && shipment.returnName;
  const ret = roundTrip
    ? shipment.returnX != null && shipment.returnY != null
      ? { x: shipment.returnX, y: shipment.returnY }
      : coordFor(shipment.returnName!)
    : null;
  const now = new Date();

  await db.trip.create({
    data: {
      code: await nextTripCode(),
      shipmentId,
      driverId: manualMode ? null : driverId,
      vehicleId: manualMode ? null : vehicleId,
      manualDriverName: manualMode ? manualDriverName : null,
      manualDriverPhone: manualMode ? manualDriverPhone : null,
      manualVehicle: manualMode ? manualVehicle : null,
      driverAllowance: driverAllowance ?? undefined,
      originName: shipment.originName,
      originX: origin.x,
      originY: origin.y,
      destinationName: shipment.destinationName,
      destX: dest.x,
      destY: dest.y,
      returnName: roundTrip ? shipment.returnName : null,
      returnX: ret?.x ?? null,
      returnY: ret?.y ?? null,
      currentX: origin.x,
      currentY: origin.y,
      status: "DISPATCHED",
      progressPct: 5,
      statusNote: "Assigned",
      departureAt: now,
      dispatchedAt: now,
      etaAt: new Date(now.getTime() + 8 * 3600000),
    },
  });

  await db.shipment.update({
    where: { id: shipmentId },
    data: { status: "DISPATCHED", cycleStage: 1 },
  });
  if (!manualMode) {
    await db.driver.update({ where: { id: driverId }, data: { status: "ON_TRIP" } });
    await db.vehicle.update({ where: { id: vehicleId }, data: { status: "ON_TRIP" } });
  }

  await logAudit({
    action: "SHIPMENT_DISPATCHED",
    entity: "Shipment",
    entityId: shipmentId,
    entityRef: shipment.code,
    after: {
      driver: manualMode ? `${manualDriverName} (manual)` : driverId,
      vehicle: manualMode ? manualVehicle : vehicleId,
      driverAllowance,
    },
  });

  revalidatePath("/shipments");
  revalidatePath("/trips");
  revalidatePath("/dispatching");
  revalidatePath("/dashboard");
  redirect(`/shipments/${shipmentId}`);
}

// After dispatch, a booking can only be cancelled — never edited — and the
// operator must record why.
export async function cancelBooking(formData: FormData) {
  await requireCapability("operate");
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!shipmentId) throw new Error("Shipment is required.");
  if (!reason) throw new Error("A cancellation reason is required.");

  const trip = await db.trip.findUnique({ where: { shipmentId } });
  if (trip) {
    await db.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", statusNote: `Cancelled: ${reason}` },
    });
    if (trip.driverId) {
      await db.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
    if (trip.vehicleId) {
      await db.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
    }
  }
  await db.shipment.update({
    where: { id: shipmentId },
    data: { status: "CANCELLED", cancelReason: reason },
  });

  await logAudit({
    action: "BOOKING_CANCELLED",
    entity: "Shipment",
    entityId: shipmentId,
    reason,
  });

  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipmentId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect(`/shipments/${shipmentId}`);
}

// Wasiqa is the transport document issued via Saudi Arabia's Transport
// General Authority (TGA) portal. Recorded manually here — there is no
// automated TGA API integration, so this only reflects what was entered.
export async function updateWasiqa(shipmentId: string, formData: FormData) {
  await requireCapability("operate");
  const wasiqaNumber = String(formData.get("wasiqaNumber") ?? "").trim() || null;
  const wasiqaStatus = String(formData.get("wasiqaStatus") ?? "").trim() || null;
  const wasiqaIssuedAtRaw = String(formData.get("wasiqaIssuedAt") ?? "");
  const wasiqaNotes = String(formData.get("wasiqaNotes") ?? "").trim() || null;
  const wasiqaIssuedAt = wasiqaIssuedAtRaw ? new Date(wasiqaIssuedAtRaw) : null;

  await db.shipment.update({
    where: { id: shipmentId },
    data: { wasiqaNumber, wasiqaStatus, wasiqaIssuedAt, wasiqaNotes },
  });
  await logAudit({
    action: "WASIQA_UPDATED",
    entity: "Shipment",
    entityId: shipmentId,
    after: { wasiqaNumber, wasiqaStatus },
  });
  revalidatePath(`/shipments/${shipmentId}`);
}
