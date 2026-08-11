"use server";

import { db } from "@/lib/db";
import { TrackingMapsAdapter } from "@/lib/gps/trackingmaps-adapter";

/**
 * Get GPS settings (stored in CompanyProfile for now)
 */
export async function getGPSSettings() {
  const profile = await db.companyProfile.findFirst();
  if (!profile) return null;

  // In a real system, we'd store these securely (encrypted env vars or secrets manager)
  // For this MVP, we'll use metadata fields
  return {
    serverUrl: process.env.GPS_SERVER_URL || "https://tracmap3.com",
    username: process.env.GPS_USERNAME || "",
    password: process.env.GPS_PASSWORD || "",
  };
}

/**
 * Sync vehicle locations from GPS tracking system
 * Called periodically (e.g., every 30 seconds during active trips)
 */
export async function syncVehicleLocations() {
  try {
    const settings = await getGPSSettings();
    if (!settings?.username) {
      console.log("GPS credentials not configured");
      return { success: false, error: "GPS not configured" };
    }

    const adapter = new TrackingMapsAdapter(settings);

    // Fetch current vehicle locations from GPS server
    const locations = await adapter.fetchLocations();

    if (!locations.length) {
      console.log("No locations received from GPS server");
      return { success: true, count: 0 };
    }

    // Match GPS devices to our vehicles and store latest positions
    let updateCount = 0;
    for (const loc of locations) {
      // Find vehicle by GPS device ID
      const gPSDevice = await db.gPSDevice.findUnique({
        where: { trackmapsDeviceId: loc.deviceId },
      });

      if (!gPSDevice) continue;

      // Store the location
      await db.vehicleLocation.create({
        data: {
          vehicleId: gPSDevice.vehicleId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          heading: loc.heading,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
        },
      });

      // Update the GPS device's last location time
      await db.gPSDevice.update({
        where: { id: gPSDevice.id },
        data: { lastLocationAt: new Date() },
      });

      updateCount++;
    }

    console.log(`GPS sync: stored ${updateCount} vehicle locations`);
    return { success: true, count: updateCount };
  } catch (error) {
    console.error("GPS sync failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get latest vehicle location
 */
export async function getVehicleLocation(vehicleId: string) {
  return db.vehicleLocation.findFirst({
    where: { vehicleId },
    orderBy: { timestamp: "desc" },
  });
}

/**
 * Get all current vehicle locations (for map display)
 */
export async function getCurrentVehicleLocations() {
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
