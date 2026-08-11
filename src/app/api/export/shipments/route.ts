import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where: Prisma.ShipmentWhereInput = {};
  const status = sp.get("status");
  const q = sp.get("q");
  const origin = sp.get("origin");
  const destination = sp.get("destination");
  if (status) where.status = status;
  if (origin) where.originName = origin;
  if (destination) where.destinationName = destination;
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { customer: { name: { contains: q } } },
      { originName: { contains: q } },
      { destinationName: { contains: q } },
    ];
  }

  const shipments = await db.shipment.findMany({
    where,
    include: { customer: true, trip: { include: { driver: true, vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Shipment ID",
    "Customer",
    "Origin",
    "Destination",
    "Priority",
    "Status",
    "Cycle Stage",
    "Driver",
    "Vehicle",
    "Weight (kg)",
    "Created At",
  ];
  const rows = shipments.map((s) => [
    s.code,
    s.customer.name,
    s.originName,
    s.destinationName,
    s.priority,
    s.status,
    s.cycleStage,
    s.trip?.driver?.name ?? "",
    s.trip?.vehicle?.plateNumber ?? "",
    s.weightKg ?? "",
    s.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipments-export.csv"`,
    },
  });
}
