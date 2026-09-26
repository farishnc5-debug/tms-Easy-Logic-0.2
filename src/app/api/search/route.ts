import { like } from "@/lib/search";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [shipments, trips, drivers, customers, vehicles] = await Promise.all([
    db.shipment.findMany({
      where: { OR: [{ code: like(q) }, { originName: like(q) }] },
      take: 5,
      include: { customer: true },
    }),
    db.trip.findMany({
      where: { code: like(q) },
      take: 5,
      include: { driver: true },
    }),
    db.driver.findMany({
      where: { OR: [{ name: like(q) }, { phone: like(q) }] },
      take: 5,
    }),
    db.customer.findMany({
      where: { OR: [{ name: like(q) }, { company: like(q) }] },
      take: 5,
    }),
    db.vehicle.findMany({
      where: { plateNumber: like(q) },
      take: 5,
    }),
  ]);

  const results = [
    ...shipments.map((s) => ({
      type: "Shipment",
      id: s.id,
      label: s.code,
      sub: `${s.customer.name} · ${s.originName} → ${s.destinationName}`,
      href: `/shipments/${s.id}`,
    })),
    ...trips.map((t) => ({
      type: "Trip",
      id: t.id,
      label: t.code,
      sub: t.driver ? `Driver: ${t.driver.name}` : "Unassigned",
      href: `/trips/${t.id}`,
    })),
    ...drivers.map((d) => ({
      type: "Driver",
      id: d.id,
      label: d.name,
      sub: d.phone,
      href: `/drivers/${d.id}`,
    })),
    ...customers.map((c) => ({
      type: c.isVendor ? "Vendor" : "Customer",
      id: c.id,
      label: c.name,
      sub: c.company ?? c.phone,
      href: c.isVendor ? `/vendors/${c.id}` : `/customers/${c.id}`,
    })),
    ...vehicles.map((v) => ({
      type: "Vehicle",
      id: v.id,
      label: v.plateNumber,
      sub: v.vehicleType,
      href: `/fleet/${v.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
