"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { VEHICLE_TYPES } from "@/lib/constants";

const VEHICLE_CODES = new Set(VEHICLE_TYPES.map((v) => v.code));

function num(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

// Create or update a lane. Every lane belongs to exactly one vendor and one
// vehicle type — the same route can price differently per vendor, and
// differently again per equipment type at the same vendor.
export async function saveLane(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const originCity = String(formData.get("originCity") ?? "").trim();
  const destinationCity = String(formData.get("destinationCity") ?? "").trim();
  const vehicleType = String(formData.get("vehicleType") ?? "").trim();
  const carrierCost = num(formData, "carrierCost");
  const sellingPrice = num(formData, "sellingPrice");
  const distanceKm = num(formData, "distanceKm");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const isActual = formData.get("isActual") === "on" || formData.get("isActual") === "1";

  if (!vendorId) throw new Error("Select which vendor this rate belongs to.");
  if (!originCity || !destinationCity) {
    throw new Error("Origin and destination cities are required.");
  }
  if (!VEHICLE_CODES.has(vehicleType as (typeof VEHICLE_TYPES)[number]["code"])) {
    throw new Error("Select a valid vehicle/equipment type.");
  }
  if (carrierCost == null || carrierCost <= 0) {
    throw new Error("A positive carrier cost is required.");
  }
  if (sellingPrice != null && sellingPrice < carrierCost) {
    throw new Error(
      `Selling price (${sellingPrice}) is below the carrier cost (${carrierCost}) — this lane would lose money. Adjust the price or leave it empty.`,
    );
  }

  const vendor = await db.customer.findUnique({ where: { id: vendorId } });
  if (!vendor || !vendor.isVendor) {
    throw new Error("Selected vendor was not found — add it under Vendors & Suppliers first.");
  }

  const data = {
    vendorId,
    originCity,
    destinationCity,
    vehicleType,
    carrierCost,
    sellingPrice,
    distanceKm,
    notes,
    isActual,
  };

  if (id) {
    const before = await db.carrierRate.findUnique({ where: { id } });
    await db.carrierRate.update({ where: { id }, data });
    await logAudit({
      action: "TARIFF_LANE_UPDATED",
      entity: "CarrierRate",
      entityId: id,
      entityRef: `${vendor.name}: ${originCity} → ${destinationCity} (${vehicleType})`,
      before: before
        ? { carrierCost: before.carrierCost, sellingPrice: before.sellingPrice, isActual: before.isActual }
        : null,
      after: { carrierCost, sellingPrice, isActual },
    });
  } else {
    const created = await db.carrierRate.create({ data });
    await logAudit({
      action: "TARIFF_LANE_ADDED",
      entity: "CarrierRate",
      entityId: created.id,
      entityRef: `${vendor.name}: ${originCity} → ${destinationCity} (${vehicleType})`,
      after: { carrierCost, sellingPrice, isActual },
    });
  }

  revalidatePath("/tariff");
}

export async function deleteLane(id: string) {
  const lane = await db.carrierRate.findUnique({ where: { id }, include: { vendor: true } });
  await db.carrierRate.delete({ where: { id } });
  await logAudit({
    action: "TARIFF_LANE_DELETED",
    entity: "CarrierRate",
    entityId: id,
    entityRef: lane ? `${lane.vendor.name}: ${lane.originCity} → ${lane.destinationCity}` : id,
    before: lane ? { carrierCost: lane.carrierCost, sellingPrice: lane.sellingPrice } : null,
  });
  revalidatePath("/tariff");
}
