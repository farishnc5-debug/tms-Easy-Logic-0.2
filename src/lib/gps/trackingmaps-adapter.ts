/**
 * Adapter for Tracking Maps (tracmap3.com / Server 3)
 * Fetches vehicle locations from the Tracking Maps GPS platform
 */

// A loosely-typed record from the GPS server's JSON (field names vary by platform)
type RawRecord = Record<string, string | number | undefined>;
const num = (x: unknown) => parseFloat(String(x));

export interface TrackingMapsConfig {
  serverUrl: string; // e.g., https://tracmap3.com
  username: string;
  password: string;
}

export interface VehicleLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  accuracy?: number;
}

export class TrackingMapsAdapter {
  private config: TrackingMapsConfig;
  private sessionToken?: string;

  constructor(config: TrackingMapsConfig) {
    this.config = config;
  }

  /**
   * Authenticate with Tracking Maps server
   */
  async authenticate(): Promise<boolean> {
    try {
      // TRACKING MAPS 3.24 uses a login form. We'll attempt a session-based login.
      // The exact endpoint depends on the server's architecture.
      // Common patterns: /login, /api/login, /authenticate
      const formData = new URLSearchParams();
      formData.append("username", this.config.username);
      formData.append("password", this.config.password);

      const response = await fetch(`${this.config.serverUrl}/index.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      if (response.ok) {
        // Successful login — session cookie will be stored by the fetch client
        this.sessionToken = "authenticated";
        return true;
      }
      return false;
    } catch (err) {
      console.error("TrackingMaps auth failed:", err);
      return false;
    }
  }

  /**
   * Fetch current locations for all devices
   * Most GPS platforms return JSON with device positions
   */
  async fetchLocations(): Promise<VehicleLocation[]> {
    try {
      if (!this.sessionToken) {
        const authed = await this.authenticate();
        if (!authed) throw new Error("Authentication failed");
      }

      // Try the common GPS API endpoint
      const response = await fetch(
        `${this.config.serverUrl}/api/vehicles`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse depending on the API response format
      // Most platforms return { vehicles: [...] } or { devices: [...] } or [ {...}, ... ]
      const vehicles = Array.isArray(data)
        ? data
        : data.vehicles || data.devices || data.locations || [];

      return (vehicles as RawRecord[]).map((v) => ({
        deviceId: String(v.id || v.device_id || v.imei || v.name),
        latitude: num(v.latitude || v.lat),
        longitude: num(v.longitude || v.lon || v.lng),
        speed: v.speed ? num(v.speed) : undefined,
        heading: v.course || v.heading ? num(v.course || v.heading) : undefined,
        timestamp: v.timestamp
          ? new Date(v.timestamp)
          : new Date(v.update_time || v.lastSeen || Date.now()),
        accuracy: v.accuracy ? num(v.accuracy) : undefined,
      }));
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      return [];
    }
  }

  /**
   * Fetch location history for a device
   */
  async fetchLocationHistory(
    deviceId: string,
    from: Date,
    to: Date
  ): Promise<VehicleLocation[]> {
    try {
      if (!this.sessionToken) {
        const authed = await this.authenticate();
        if (!authed) throw new Error("Authentication failed");
      }

      const params = new URLSearchParams({
        device_id: deviceId,
        from: from.toISOString(),
        to: to.toISOString(),
      });

      const response = await fetch(
        `${this.config.serverUrl}/api/locations/history?${params}`,
        {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const points = Array.isArray(data) ? data : data.locations || [];

      return (points as RawRecord[]).map((p) => ({
        deviceId,
        latitude: num(p.latitude || p.lat),
        longitude: num(p.longitude || p.lon),
        speed: p.speed ? num(p.speed) : undefined,
        heading: p.course ? num(p.course) : undefined,
        timestamp: new Date(String(p.timestamp || p.time)),
        accuracy: p.accuracy ? num(p.accuracy) : undefined,
      }));
    } catch (err) {
      console.error("Failed to fetch location history:", err);
      return [];
    }
  }
}
