import Link from "next/link";
import { Truck, MapPinned, PackageCheck, XCircle, Clock, Download } from "lucide-react";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import StatCard from "@/components/dashboard/stat-card";
import ShipmentFilters from "@/components/shipments/shipment-filters";
import TripsBoard from "@/components/trips/trips-board";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All Trips", statuses: null },
  {
    key: "ongoing",
    label: "Ongoing",
    statuses: ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "RETURN_TRANSIT", "AT_RETURN"],
  },
  { key: "completed", label: "Completed", statuses: ["DELIVERED", "RETURN_OFFLOADED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
  { key: "delayed", label: "Delayed", statuses: ["DELAYED"] },
];

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const tab = typeof sp.tab === "string" ? sp.tab : "all";
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  const origin = typeof sp.origin === "string" ? sp.origin : "";
  const destination = typeof sp.destination === "string" ? sp.destination : "";

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  const where: Prisma.TripWhereInput = {};
  if (status) where.status = status;
  else if (activeTab.statuses) where.status = { in: activeTab.statuses };
  if (origin) where.originName = origin;
  if (destination) where.destinationName = destination;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(new Date(to).getTime() + 86400000);
  }
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { driver: { name: { contains: q } } },
      { vehicle: { plateNumber: { contains: q } } },
    ];
  }

  const [trips, statusCounts, origins, destinations] = await Promise.all([
    db.trip.findMany({
      where,
      include: { driver: true, vehicle: true, shipment: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.trip.groupBy({ by: ["status"], _count: { status: true } }),
    db.trip.findMany({ select: { originName: true }, distinct: ["originName"] }),
    db.trip.findMany({ select: { destinationName: true }, distinct: ["destinationName"] }),
  ]);

  const countFor = (s: string) => statusCounts.find((x) => x.status === s)?._count.status ?? 0;
  const totalAll = statusCounts.reduce((sum, x) => sum + x._count.status, 0);
  const ongoing =
    countFor("DISPATCHED") +
    countFor("COLLECTING") +
    countFor("IN_TRANSIT") +
    countFor("AT_DELIVERY") +
    countFor("RETURN_TRANSIT") +
    countFor("AT_RETURN");

  const buildTabHref = (key: string) => {
    const params = new URLSearchParams();
    if (key !== "all") params.set("tab", key);
    return `/trips${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const tripRows = trips.map((t) => ({
    id: t.id,
    code: t.code,
    shipmentId: t.shipmentId,
    tripType: t.shipment.tripType,
    delayedFrom: t.delayedFrom,
    shipmentCode: t.shipment.code,
    customerName: t.shipment.customer.name,
    originName: t.originName,
    destinationName: t.destinationName,
    originX: t.originX,
    originY: t.originY,
    destX: t.destX,
    destY: t.destY,
    currentX: t.currentX,
    currentY: t.currentY,
    status: t.status,
    statusNote: t.statusNote,
    progressPct: t.progressPct,
    distanceKm: t.distanceKm,
    departureAt: t.departureAt?.toISOString() ?? null,
    etaAt: t.etaAt?.toISOString() ?? null,
    driverName: t.driver?.name ?? null,
    driverPhone: t.driver?.phone ?? null,
    vehiclePlate: t.vehicle?.plateNumber ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div />
        <a
          href={`/api/export/shipments`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Download size={15} /> {tr("Export")}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Truck} label={tr("Total Trips")} value={totalAll} color="#2563eb" />
        <StatCard icon={MapPinned} label={tr("Ongoing")} value={ongoing} color="#0284c7" />
        <StatCard
          icon={PackageCheck}
          label={tr("Completed")}
          value={countFor("DELIVERED") + countFor("RETURN_OFFLOADED")}
          color="#16a34a"
        />
        <StatCard icon={XCircle} label={tr("Cancelled")} value={countFor("CANCELLED")} color="#7c3aed" />
        <StatCard icon={Clock} label={tr("Delayed")} value={countFor("DELAYED")} color="#ef4444" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={buildTabHref(t.key)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium ${
                activeTab.key === t.key
                  ? "border-b-2 border-brand-600 text-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tr(t.label)}
            </Link>
          ))}
        </div>
        <ShipmentFilters
          origins={origins.map((o) => o.originName)}
          destinations={destinations.map((d) => d.destinationName)}
        />
      </div>

      <TripsBoard trips={tripRows} />
    </div>
  );
}
