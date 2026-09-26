"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { db } from "@/lib/db";
import { flowFor } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

// Overall progress per status. Round trips reserve 0-70% for the loaded leg
// (origin → delivery) and 70-100% for the empty return leg (delivery → return).
const ONE_WAY_PROGRESS: Record<string, number> = {
  PENDING: 0,
  DISPATCHED: 10,
  COLLECTING: 25,
  IN_TRANSIT: 60,
  AT_DELIVERY: 85,
  DELIVERED: 100,
  DELAYED: 55,
  CANCELLED: 0,
};
const ROUND_TRIP_PROGRESS: Record<string, number> = {
  PENDING: 0,
  DISPATCHED: 7,
  COLLECTING: 18,
  IN_TRANSIT: 42,
  AT_DELIVERY: 60,
  DELIVERED: 70,
  RETURN_TRANSIT: 80,
  AT_RETURN: 92,
  RETURN_OFFLOADED: 100,
  DELAYED: 40,
  CANCELLED: 0,
};

const STATUS_NOTE: Record<string, string> = {
  DISPATCHED: "Assigned",
  COLLECTING: "Loading",
  IN_TRANSIT: "On the way",
  AT_DELIVERY: "Arrived",
  DELIVERED: "Completed",
  RETURN_TRANSIT: "Returning empty",
  AT_RETURN: "Waiting for offloading",
  RETURN_OFFLOADED: "Cycle completed",
  DELAYED: "Traffic Issue",
  CANCELLED: "Cancelled",
};

// Trip timestamp column recorded when each stage is reached
const TIMESTAMP_FIELD: Record<string, string> = {
  DISPATCHED: "dispatchedAt",
  COLLECTING: "collectingAt",
  IN_TRANSIT: "inTransitAt",
  AT_DELIVERY: "atDeliveryAt",
  DELIVERED: "deliveredAt",
  RETURN_TRANSIT: "returnTransitAt",
  AT_RETURN: "atReturnAt",
  RETURN_OFFLOADED: "returnOffloadedAt",
};

// Shipment cycleStage per status (round trips: 6 = left delivery, 7-9 = return leg)
const CYCLE_STAGE_OF: Record<string, number> = {
  DISPATCHED: 1,
  COLLECTING: 2,
  IN_TRANSIT: 3,
  AT_DELIVERY: 4,
  DELIVERED: 5,
  RETURN_TRANSIT: 7,
  AT_RETURN: 8,
  RETURN_OFFLOADED: 9,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type TripForPosition = {
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  returnX: number | null;
  returnY: number | null;
};

// Truck position on the map for a given overall progress, following the
// loaded leg then (for round trips) the empty return leg.
function positionFor(trip: TripForPosition, roundTrip: boolean, progress: number) {
  if (roundTrip && progress > 70 && trip.returnX != null && trip.returnY != null) {
    const t = (progress - 70) / 30;
    return {
      currentX: lerp(trip.destX, trip.returnX, t),
      currentY: lerp(trip.destY, trip.returnY, t),
    };
  }
  const t = progress / (roundTrip ? 70 : 100);
  return {
    currentX: lerp(trip.originX, trip.destX, Math.min(1, t)),
    currentY: lerp(trip.originY, trip.destY, Math.min(1, t)),
  };
}

// Statuses at which the driver & truck become free again
function isFinalStatus(status: string, roundTrip: boolean) {
  return roundTrip ? status === "RETURN_OFFLOADED" : status === "DELIVERED";
}

export async function updateTripStatus(tripId: string, status: string, reason?: string) {
  await requireCapability("field");
  const trip = await db.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { shipment: { select: { tripType: true } } },
  });
  if (status === "CANCELLED" && !reason?.trim()) {
    throw new Error("A cancellation reason is required.");
  }
  const roundTrip = trip.shipment.tripType === "ROUND_TRIP";
  const PROGRESS = roundTrip ? ROUND_TRIP_PROGRESS : ONE_WAY_PROGRESS;
  const now = new Date();
  // A delay freezes the trip where it is — the truck doesn't move backwards
  const progress = status === "DELAYED" ? trip.progressPct : (PROGRESS[status] ?? trip.progressPct);
  const resuming = trip.status === "DELAYED" && status === trip.delayedFrom;

  const extra: Record<string, Date> = {};
  const field = TIMESTAMP_FIELD[status];
  // Resuming to the pre-delay status keeps its original timestamp
  if (field && !resuming) extra[field] = now;
  // Starting the empty-return leg means the driver has left the delivery side
  if (status === "RETURN_TRANSIT" && !trip.leftDeliveryAt) extra.leftDeliveryAt = now;

  await db.trip.update({
    where: { id: tripId },
    data: {
      status,
      progressPct: progress,
      // Remember where the trip was so Resume can return to it
      delayedFrom: status === "DELAYED" ? trip.status : null,
      statusNote:
        status === "CANCELLED" && reason
          ? `Cancelled: ${reason.trim()}`
          : (STATUS_NOTE[status] ?? trip.statusNote),
      ...positionFor(trip, roundTrip, progress),
      ...extra,
    },
  });

  const cycleStage = CYCLE_STAGE_OF[status];
  await db.shipment.update({
    where: { id: trip.shipmentId },
    data: {
      status,
      // A delay keeps the shipment at the stage it was delayed in
      cycleStage:
        cycleStage ?? (status === "DELAYED" ? (CYCLE_STAGE_OF[trip.status] ?? undefined) : undefined),
      cancelReason: status === "CANCELLED" && reason ? reason.trim() : undefined,
    },
  });

  if (isFinalStatus(status, roundTrip) || status === "CANCELLED") {
    if (trip.driverId) await db.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    if (trip.vehicleId) await db.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
  }

  await logAudit({
    action: status === "CANCELLED" ? "TRIP_CANCELLED" : "TRIP_STATUS_ADVANCED",
    entity: "Trip",
    entityId: trip.id,
    entityRef: trip.code,
    before: { status: trip.status, progressPct: trip.progressPct },
    after: { status, progressPct: progress },
    reason: reason?.trim() || null,
  });

  // Delivery starts the accounts follow-up cycle (originals still with driver)
  if (status === "DELIVERED") {
    const existing = await db.settlement.findUnique({ where: { shipmentId: trip.shipmentId } });
    if (!existing) {
      const shipment = await db.shipment.findUniqueOrThrow({
        where: { id: trip.shipmentId },
        include: { customer: true },
      });
      await db.settlement.create({
        data: {
          shipmentId: trip.shipmentId,
          status: "DOCS_WITH_DRIVER",
          paymentTerms: shipment.customer.paymentTerms,
          creditDays: shipment.customer.creditDays,
        },
      });
    }
    revalidatePath("/settlements");
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${trip.shipmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/map-tracking");
}

// Step the lifecycle one stage BACKWARD (mistake correction). The recorded
// progress of the stage being undone is deleted (its timestamp is cleared).
export async function regressTripStatus(tripId: string) {
  await requireCapability("operate");
  const trip = await db.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { shipment: { select: { tripType: true } } },
  });
  const roundTrip = trip.shipment.tripType === "ROUND_TRIP";
  const flow = flowFor(trip.shipment.tripType);

  const idx = flow.indexOf(trip.status);
  if (idx < 0) {
    throw new Error(
      `Cannot step back from status "${trip.status}" — resume or fix the trip status first.`,
    );
  }
  if (idx === 0) {
    throw new Error("The trip is already at the first stage — nothing to undo.");
  }
  const prev = flow[idx - 1];

  // Undoing a delivery also deletes the accounts follow-up record — but only
  // if accounts has not started processing it yet.
  if (trip.status === "DELIVERED") {
    const settlement = await db.settlement.findUnique({ where: { shipmentId: trip.shipmentId } });
    if (settlement) {
      if (settlement.status !== "DOCS_WITH_DRIVER" || settlement.invoicedAt) {
        throw new Error(
          "Cannot undo delivery: the accounts department already started the payment follow-up for this shipment.",
        );
      }
      await db.settlement.delete({ where: { id: settlement.id } });
    }
  }

  // If we are undoing the final stage, the driver & truck go back on the road
  if (isFinalStatus(trip.status, roundTrip)) {
    if (trip.driverId) await db.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    if (trip.vehicleId) await db.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
  }

  const PROGRESS = roundTrip ? ROUND_TRIP_PROGRESS : ONE_WAY_PROGRESS;
  const progress = PROGRESS[prev] ?? 0;

  // Delete the recorded progress of the stage we are leaving
  const cleared: Record<string, null> = {};
  const undoneField = TIMESTAMP_FIELD[trip.status];
  if (undoneField) cleared[undoneField] = null;
  if (trip.status === "RETURN_TRANSIT") cleared.leftDeliveryAt = null;

  await db.trip.update({
    where: { id: tripId },
    data: {
      status: prev,
      progressPct: progress,
      statusNote: `${STATUS_NOTE[prev] ?? ""} (corrected)`.trim(),
      ...positionFor(trip, roundTrip, progress),
      ...cleared,
    },
  });

  await db.shipment.update({
    where: { id: trip.shipmentId },
    data: { status: prev, cycleStage: CYCLE_STAGE_OF[prev] ?? 1 },
  });

  // History is preserved here even though the trip's timestamp is cleared
  await logAudit({
    action: "TRIP_STATUS_REVERSED",
    entity: "Trip",
    entityId: trip.id,
    entityRef: trip.code,
    before: {
      status: trip.status,
      progressPct: trip.progressPct,
      undoneStageTimestamp: undoneField ? (trip as unknown as Record<string, unknown>)[undoneField] : null,
    },
    after: { status: prev, progressPct: progress },
    reason: "Stage advanced by mistake — stepped back by operator",
  });

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${trip.shipmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/map-tracking");
  revalidatePath("/settlements");
}

export async function updateTripProgress(tripId: string, progressPct: number) {
  await requireCapability("field");
  const trip = await db.trip.findUniqueOrThrow({ where: { id: tripId } });
  const t = Math.max(0, Math.min(100, progressPct)) / 100;
  await db.trip.update({
    where: { id: tripId },
    data: {
      progressPct: Math.round(t * 100),
      currentX: lerp(trip.originX, trip.destX, t),
      currentY: lerp(trip.originY, trip.destY, t),
    },
  });
  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map-tracking");
  revalidatePath("/dashboard");
}

export async function setTripAllowance(formData: FormData) {
  await requireCapability("operate");
  const tripId = String(formData.get("tripId") ?? "");
  const amountRaw = String(formData.get("driverAllowance") ?? "").trim();
  if (!tripId) throw new Error("Trip is required.");
  const amount = amountRaw ? Number(amountRaw) : null;
  if (amount !== null && (Number.isNaN(amount) || amount < 0)) {
    throw new Error("Allowance must be a positive amount.");
  }

  const trip = await db.trip.findUniqueOrThrow({ where: { id: tripId } });
  await db.trip.update({
    where: { id: tripId },
    data: {
      driverAllowance: amount,
      // changing the amount resets the paid flag only when clearing it
      ...(amount === null ? { allowancePaid: false, allowancePaidAt: null } : {}),
    },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/shipments/${trip.shipmentId}`);
  revalidatePath("/trips");
}

// Accounts department transfers the trip money to the driver. Hard gate: the
// yard must have confirmed receiving the original signed documents first.
// The accountant can attach the bank/transfer slip as proof.
export async function sendTripMoney(formData: FormData) {
  await requireCapability("finance");
  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) throw new Error("Trip is required.");
  const trip = await db.trip.findUniqueOrThrow({ where: { id: tripId } });
  if (trip.driverAllowance == null || trip.driverAllowance <= 0) {
    throw new Error("Set the trip money amount before sending.");
  }

  const settlement = await db.settlement.findUnique({
    where: { shipmentId: trip.shipmentId },
  });
  if (!settlement?.docsReceivedAt) {
    throw new Error(
      "Trip money is locked: the yard has not confirmed receiving the original signed delivery documents yet.",
    );
  }

  // Optional payment slip attachment (photo/PDF of the transfer)
  let slipUrl: string | null = null;
  const slip = formData.get("slip");
  if (slip instanceof File && slip.size > 0) {
    const { saveUpload } = await import("@/lib/storage");
    slipUrl = await saveUpload(slip, "slips");
  }

  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();

  await db.trip.update({
    where: { id: tripId },
    data: {
      allowancePaid: true,
      allowancePaidAt: new Date(),
      allowanceSlipUrl: slipUrl,
      allowanceSentBy: user?.name ?? "Accounts",
    },
  });

  await logAudit({
    action: "TRIP_MONEY_PAID",
    entity: "Trip",
    entityId: trip.id,
    entityRef: trip.code,
    after: {
      amount: trip.driverAllowance,
      slipAttached: !!slipUrl,
      docsReceivedAt: settlement.docsReceivedAt.toISOString(),
    },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/shipments/${trip.shipmentId}`);
  revalidatePath("/trips");
  revalidatePath("/settlements");
}

export async function markAllowancePaid(tripId: string, paid: boolean) {
  await requireCapability("finance");
  const trip = await db.trip.findUniqueOrThrow({ where: { id: tripId } });
  // Yard rule: trip money is only handed over once the driver returns the
  // signed original delivery documents to the yard.
  if (paid) {
    const settlement = await db.settlement.findUnique({
      where: { shipmentId: trip.shipmentId },
    });
    if (!settlement?.docsReceivedAt) {
      throw new Error(
        "Trip money is locked: the driver has not returned the original signed delivery documents to the yard yet.",
      );
    }
  }
  await db.trip.update({
    where: { id: tripId },
    data: {
      allowancePaid: paid,
      allowancePaidAt: paid ? new Date() : null,
      // reversing a payment also clears the slip/sender proof
      ...(paid ? {} : { allowanceSlipUrl: null, allowanceSentBy: null }),
    },
  });

  await logAudit({
    action: paid ? "TRIP_MONEY_PAID" : "TRIP_MONEY_PAYMENT_REVERSED",
    entity: "Trip",
    entityId: trip.id,
    entityRef: trip.code,
    before: { allowancePaid: trip.allowancePaid, driverAllowance: trip.driverAllowance },
    after: { allowancePaid: paid },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/shipments/${trip.shipmentId}`);
  revalidatePath("/trips");
}

export async function assignDriverVehicle(tripId: string, driverId: string, vehicleId: string) {
  await requireCapability("operate");
  const trip = await db.trip.findUniqueOrThrow({ where: { id: tripId } });
  if (trip.driverId && trip.driverId !== driverId) {
    await db.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }).catch(() => {});
  }
  if (trip.vehicleId && trip.vehicleId !== vehicleId) {
    await db.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }).catch(() => {});
  }
  await db.trip.update({ where: { id: tripId }, data: { driverId, vehicleId } });
  await db.driver.update({ where: { id: driverId }, data: { status: "ON_TRIP" } });
  await db.vehicle.update({ where: { id: vehicleId }, data: { status: "ON_TRIP" } });

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/dispatching");
}
