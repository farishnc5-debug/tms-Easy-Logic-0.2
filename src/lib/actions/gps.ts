"use server";

import { db } from "@/lib/db";
import { requireCapability } from "@/lib/rbac";
import { runGpsSync } from "@/lib/gps-sync";

/**
 * Sync vehicle locations from the GPS tracking system (admin "sync now").
 * The scheduled job calls runGpsSync() directly.
 */
export async function syncVehicleLocations() {
  await requireCapability("admin");
  return runGpsSync();
}

/**
 * Get latest vehicle location
 */
export async function getVehicleLocation(vehicleId: string) {
  await requireCapability("read");
  return db.vehicleLocation.findFirst({
    where: { vehicleId },
    orderBy: { timestamp: "desc" },
  });
}

/**
 * Get all current vehicle locations (for map display)
 */
export async function getCurrentVehicleLocations() {
  await requireCapability("read");
  const locations = await db.vehicleLocation.findMany({
    where: {
      vehicle: {
        status: "ON_TRIP", // Only show actively moving vehicles
      },
    },
    distinct: ["vehicleId"],
    orderBy: { timestamp: "desc" },
    include: {
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          vehicleType: true,
        },
      },
    },
  });

  return locations.map((loc) => ({
    id: loc.id,
    vehicleId: loc.vehicleId,
    plateNumber: loc.vehicle.plateNumber,
    vehicleType: loc.vehicle.vehicleType,
    latitude: loc.latitude,
    longitude: loc.longitude,
    speed: loc.speed ?? undefined,
    heading: loc.heading ?? undefined,
    timestamp: loc.timestamp,
  }));
}

/**
 * Link a vehicle to a GPS device
 */
export async function linkGPSDevice(vehicleId: string, trackmapsDeviceId: string) {
  await requireCapability("admin");
  try {
    // Check if already linked
    const existing = await db.gPSDevice.findFirst({
      where: { vehicleId },
    });

    if (existing) {
      // Update the device ID
      await db.gPSDevice.update({
        where: { id: existing.id },
        data: { trackmapsDeviceId },
      });
    } else {
      // Create new link
      await db.gPSDevice.create({
        data: { vehicleId, trackmapsDeviceId },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to link GPS device:", error);
    return { success: false, error: String(error) };
  }
}
