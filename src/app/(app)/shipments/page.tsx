import { like } from "@/lib/search";
import Link from "next/link";
import { Package, Truck, PackageCheck, XCircle, Clock, Plus, Download, Eye, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import StatCard from "@/components/dashboard/stat-card";
import ShipmentFilters from "@/components/shipments/shipment-filters";
import CycleDots from "@/components/shipments/cycle-dots";
import { StatusBadge, Pill } from "@/components/ui/badge";
import Pagination from "@/components/ui/pagination";
import { fmtDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const TABS = [
  { key: "all", label: "All Shipments", statuses: null },
  {
    key: "ongoing",
    label: "Ongoing",
    statuses: ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "RETURN_TRANSIT", "AT_RETURN"],
  },
  { key: "completed", label: "Completed", statuses: ["DELIVERED", "RETURN_OFFLOADED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
  { key: "delayed", label: "Delayed", statuses: ["DELAYED"] },
];

export default async function ShipmentsPage({
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
  const page = Math.max(1, Number(sp.page) || 1);

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  const where: Prisma.ShipmentWhereInput = {};
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
      { code: like(q) },
      { customer: { name: like(q) } },
      { originName: like(q) },
      { destinationName: like(q) },
    ];
  }

  const [total, shipments, statusCounts, origins, destinations] = await Promise.all([
    db.shipment.count({ where }),
    db.shipment.findMany({
      where,
      include: { customer: true, trip: { include: { driver: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.shipment.groupBy({ by: ["status"], _count: { status: true } }),
    db.shipment.findMany({ select: { originName: true }, distinct: ["originName"] }),
    db.shipment.findMany({ select: { destinationName: true }, distinct: ["destinationName"] }),
  ]);

  const countFor = (s: string) => statusCounts.find((x) => x.status === s)?._count.status ?? 0;
  const totalAll = statusCounts.reduce((sum, x) => sum + x._count.status, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildTabHref = (key: string) => {
    const params = new URLSearchParams();
    if (key !== "all") params.set("tab", key);
    return `/shipments${params.toString() ? `?${params.toString()}` : ""}`;
  };
  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (p > 1) params.set("page", String(p));
    return `/shipments${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div />
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/shipments?${new URLSearchParams({ tab, status, q, from, to, origin, destination }).toString()}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download size={15} /> {tr("Export")}
          </a>
          <Link
            href="/shipments/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={15} /> {tr("New Shipment")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Package} label={tr("Total Shipments")} value={totalAll} color="#ea580c" />
        <StatCard icon={Clock} label={tr("PENDING")} value={countFor("PENDING")} color="#f59e0b" />
        <StatCard icon={Truck} label={tr("IN TRANSIT")} value={countFor("IN_TRANSIT")} color="#0284c7" />
        <StatCard icon={PackageCheck} label={tr("DELIVERED")} value={countFor("DELIVERED")} color="#16a34a" />
        <StatCard icon={Clock} label={tr("DELAYED")} value={countFor("DELAYED")} color="#ef4444" />
        <StatCard icon={XCircle} label={tr("CANCELLED")} value={countFor("CANCELLED")} color="#64748b" />
      </div>

      <div className="card">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-start text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">{tr("Shipment ID")}</th>
                <th className="px-4 py-3">{tr("Customer")}</th>
                <th className="px-4 py-3">{tr("Route")}</th>
                <th className="px-4 py-3">{tr("Status")}</th>
                <th className="px-4 py-3">{tr("Logistics Cycle")}</th>
                <th className="px-4 py-3">{tr("Driver")}</th>
                <th className="px-4 py-3">{tr("Created")}</th>
                <th className="px-4 py-3 text-end">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                      {s.code}
                    </Link>
                    <div className="mt-0.5">
                      <Pill className="bg-slate-100 text-slate-500">{s.priority}</Pill>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{s.customer.name}</p>
                    <p className="text-xs text-slate-400">{s.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{s.originName}</p>
                    <p className="text-xs text-slate-400">↓ {s.destinationName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <CycleDots
                      stage={s.cycleStage}
                      delayed={s.status === "DELAYED"}
                      total={s.tripType === "ROUND_TRIP" ? 9 : 6}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.trip?.driver?.name ?? <span className="text-slate-300">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/shipments/${s.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="View"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        href={`/shipments/${s.id}/edit`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    No shipments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          buildHref={buildPageHref}
        />
      </div>
    </div>
  );
}
