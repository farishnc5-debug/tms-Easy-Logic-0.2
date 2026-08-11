import { NextRequest, NextResponse } from "next/server";
import { TrackingMapsAdapter } from "@/lib/gps/trackingmaps-adapter";

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, username, password } = await request.json();

    if (!serverUrl || !username || !password) {
      return NextResponse.json(
        { error: "Missing GPS credentials" },
        { status: 400 }
      );
    }

    const adapter = new TrackingMapsAdapter({
      serverUrl,
      username,
      password,
    });

    // Try to authenticate
    const authed = await adapter.authenticate();
    if (!authed) {
      return NextResponse.json(
        { error: "Authentication failed. Check credentials and server URL." },
        { status: 401 }
      );
    }

    // Try to fetch a sample of locations
    const locations = await adapter.fetchLocations();

    return NextResponse.json({
      success: true,
      message: "Connected successfully",
      locationCount: locations.length,
    });
  } catch (error) {
    console.error("GPS test failed:", error);
    return NextResponse.json(
      { error: `GPS connection test failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
