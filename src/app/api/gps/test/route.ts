import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { TrackingMapsAdapter } from "@/lib/gps/trackingmaps-adapter";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "admin")) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  try {
    const { serverUrl, username, password } = await request.json();

    if (!serverUrl || !username || !password) {
      return NextResponse.json(
        { error: "Missing GPS credentials" },
        { status: 400 }
      );
    }

    // Server-side request to a user-supplied address: only allow public https
    // URLs so this can't be pointed at internal services.
    let parsed: URL;
    try {
      parsed = new URL(serverUrl);
    } catch {
      return NextResponse.json({ error: "Invalid server URL" }, { status: 400 });
    }
    const host = parsed.hostname;
    const isPrivate =
      host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith(".internal");
    if (parsed.protocol !== "https:" || isPrivate) {
      return NextResponse.json({ error: "Server URL must be a public https address" }, { status: 400 });
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
