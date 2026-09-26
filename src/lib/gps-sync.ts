import { db } from "@/lib/db";
import { TrackingMapsAdapter } from "@/lib/gps/trackingmaps-adapter";

// GPS credentials come from environment variables (never the browser / database).
function getGPSSettings() {
  return {
    serverUrl: process.env.GPS_SERVER_URL || "https://tracmap3.com",
    username: process.env.GPS_USERNAME || "",
    password: process.env.GPS_PASSWORD || "",
  };
}

// Pulls current vehicle positions from the Tracking Maps platform and stores
// them. Used by the admin "sync now" action and by the scheduled job.
export async function runGpsSync() {
  try {
    const settings = getGPSSettings();
    if (!settings.username) {
      return { success: false, error: "GPS not configured (set GPS_USERNAME / GPS_PASSWORD)" };
    }
    const adapter = new TrackingMapsAdapter(settings);
    const locations = await adapter.fetchLocations();
    if (!locations.length) return { success: true, count: 0 };

    let updateCount = 0;
    for (const loc of locations) {
      const device = await db.gPSDevice.findUnique({ where: { trackmapsDeviceId: loc.deviceId } });
      if (!device) continue;
      await db.vehicleLocation.create({
        data: {
          vehicleId: device.vehicleId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          heading: loc.heading,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
        },
      });
      await db.gPSDevice.update({ where: { id: device.id }, data: { lastLocationAt: new Date() } });
      updateCount++;
    }
    return { success: true, count: updateCount };
  } catch (error) {
    console.error("GPS sync failed:", error);
    return { success: false, error: String(error) };
  }
}
