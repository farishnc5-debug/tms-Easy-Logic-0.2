import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey, hasScope } from "@/lib/api-key-auth";

// Public, key-authenticated API — the foundation the future "Agent TMS"
// (agentic AI) will call. Authenticate with:
//   Authorization: Bearer <key>
// Generate a key on the Connections page (scope "shipments:read").
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <key> header." }, { status: 401 });
  }

  const apiKey = await verifyApiKey(token);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }
  if (!hasScope(apiKey.scopes, "shipments:read")) {
    return NextResponse.json({ error: "This key does not have the shipments:read scope." }, { status: 403 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 25), 100);
  const shipments = await db.shipment.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true, company: true } }, trip: { select: { status: true, progressPct: true } } },
  });

  return NextResponse.json({
    data: shipments.map((s) => ({
      id: s.id,
      code: s.code,
      customer: s.customer.company ?? s.customer.name,
      origin: s.originName,
      destination: s.destinationName,
      status: s.status,
      priority: s.priority,
      tripStatus: s.trip?.status ?? null,
      tripProgressPct: s.trip?.progressPct ?? null,
      createdAt: s.createdAt,
    })),
  });
}
