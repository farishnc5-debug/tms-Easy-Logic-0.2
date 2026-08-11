import Link from "next/link";
import { db } from "@/lib/db";
import CycleStepper from "@/components/dashboard/cycle-stepper";
import LiveMap from "@/components/map/live-map";
import DonutChart from "@/components/charts/donut-chart";
import TrendLine from "@/components/charts/trend-line";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo, fmtTime } from "@/lib/format";
import { stageOfStatus } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";
import { ClipboardEdit, Upload, AlertTriangle, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

function seededTrend(seed: number, base: number, points = 8) {
  const arr: { label: string; value: number }[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    const wobble = Math.sin(seed + i * 1.3) * 6;
    v = Math.max(0, base + wobble + i * 0.4);
    arr.push({ label: `${i}`, value: Math.round(v) });
  }
  return arr;
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const [shipmentCounts, vehicleCounts, currentTrip, alerts, allTrips] = await Promise.all([
    db.shipment.groupBy({ by: ["status"], _count: { status: true } }),
    db.vehicle.groupBy({ by: ["status"], _count: { status: true } }),
    db.trip.findFirst({
      where: { status: { in: ["IN_TRANSIT", "RETURN_TRANSIT"] } },
      orderBy: { updatedAt: "desc" },
      include: { driver: true, vehicle: true, shipment: { include: { customer: true } } },
    }),
    db.alert.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.trip.findMany({
      where: {
        status: {
          in: [
            "IN_TRANSIT",
            "DISPATCHED",
            "COLLECTING",
            "AT_DELIVERY",
            "DELAYED",
            "RETURN_TRANSIT",
            "AT_RETURN",
          ],
        },
      },
      select: {
        id: true,
        code: true,
        originName: true,
        destinationName: true,
        originX: true,
        originY: true,
        destX: true,
        destY: true,
        currentX: true,
        currentY: true,
        status: true,
      },
      take: 30,
    }),
  ]);

  const countFor = (arr: typeof shipmentCounts, s: string) =>
    arr.find((x) => x.status === s)?._count.status ?? 0;
  const vCountFor = (s: string) => vehicleCounts.find((x) => x.status === s)?._count.status ?? 0;

  const totalShipments = shipmentCounts.reduce((sum, x) => sum + x._count.status, 0);
  const delivered = countFor(shipmentCounts, "DELIVERED");
  const inTransit = countFor(shipmentCounts, "IN_TRANSIT");
  const atDelivery = countFor(shipmentCounts, "AT_DELIVERY");
  const pending = countFor(shipmentCounts, "PENDING") + countFor(shipmentCounts, "DISPATCHED") + countFor(shipmentCounts, "COLLECTING");
  const delayed = countFor(shipmentCounts, "DELAYED");

  const totalVehicles = vehicleCounts.reduce((sum, x) => sum + x._count.status, 0);
  const onTrip = vCountFor("ON_TRIP");
  const available = vCountFor("AVAILABLE");
  const maintenance = vCountFor("MAINTENANCE");
  const offline = vCountFor("OFFLINE");

  const onTimePct =
    delivered + delayed > 0 ? Math.round((delivered / (delivered + delayed)) * 100) : 92;

  const trip = currentTrip;
  const currentStage = trip ? stageOfStatus(trip.status) : 1;

  return (
    <div className="space-y-6">
      <CycleStepper
        currentStage={trip ? currentStage : 1}
        tripType={trip?.shipment.tripType}
        timestamps={
          trip
            ? {
                dispatchedAt: trip.dispatchedAt,
                collectingAt: trip.collectingAt,
                inTransitAt: trip.inTransitAt,
                atDeliveryAt: trip.atDeliveryAt,
                deliveredAt: trip.deliveredAt,
                leftDeliveryAt: trip.leftDeliveryAt,
                returnTransitAt: trip.returnTransitAt,
                atReturnAt: trip.atReturnAt,
                returnOffloadedAt: trip.returnOffloadedAt,
              }
            : {
                dispatchedAt: null,
                collectingAt: null,
                inTransitAt: null,
                atDeliveryAt: null,
                deliveredAt: null,
                leftDeliveryAt: null,
              }
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-400">
                {tr("CURRENT TRIP")} {trip ? `— ${trip.code}` : ""}
              </p>
            </div>
            {trip && <StatusBadge status={trip.status} />}
          </div>

          {trip ? (
            <>
              <LiveMap
                trips={[
                  {
                    id: trip.id,
                    code: trip.code,
                    originName: trip.originName,
                    destinationName: trip.destinationName,
                    originX: trip.originX,
                    originY: trip.originY,
                    destX: trip.destX,
                    destY: trip.destY,
                    currentX: trip.currentX,
                    currentY: trip.currentY,
                    status: trip.status,
                  },
                ]}
                selectedTripId={trip.id}
                height={280}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-6">
                <div>
                  <p className="text-xs text-slate-400">Driver</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar name={trip.driver?.name ?? "?"} size={24} />
                    <span className="text-sm font-medium text-slate-700">
                      {trip.driver?.name ?? "Unassigned"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Vehicle</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {trip.vehicle?.plateNumber ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">From</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{trip.originName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">To</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{trip.destinationName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Distance</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {trip.distanceKm ? `${trip.distanceKm} KM` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">ETA</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{fmtTime(trip.etaAt)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">
              No trips currently in transit
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">
            {tr("TRIP PROGRESS")}
          </p>
          {trip ? (
            <>
              <div className="flex items-center gap-4">
                <DonutChart
                  size={110}
                  centerValue={`${trip.progressPct}%`}
                  centerLabel="Completed"
                  data={[
                    { label: "Done", value: trip.progressPct, color: "#2563eb" },
                    { label: "Remaining", value: 100 - trip.progressPct, color: "#e2e8f0" },
                  ]}
                />
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                    <span className="text-slate-500">Dispatched</span>
                    <span className="ml-auto font-medium text-slate-700">{fmtTime(trip.dispatchedAt)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Collecting</span>
                    <span className="ml-auto font-medium text-slate-700">{fmtTime(trip.collectingAt)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span className="text-slate-500">In Transit</span>
                    <span className="ml-auto font-medium text-slate-700">{fmtTime(trip.inTransitAt)}</span>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No active trip</p>
          )}

          <p className="mb-3 mt-6 text-xs font-semibold tracking-widest text-slate-400">
            {tr("QUICK ACTIONS")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={trip ? `/trips/${trip.id}` : "/trips"}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
            >
              <ClipboardEdit size={14} /> {tr("Update Status")}
            </Link>
            <Link
              href={trip ? `/pod/new?shipmentId=${trip.shipmentId}` : "/pod"}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Upload size={14} /> {tr("Upload POD")}
            </Link>
            <Link
              href={trip ? `/incidents/new?tripId=${trip.id}` : "/incidents/new"}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              <AlertTriangle size={14} /> {tr("Report Incident")}
            </Link>
            <a
              href={trip?.driver?.phone ? `tel:${trip.driver.phone}` : undefined}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Phone size={14} /> {tr("Contact Driver")}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              {tr("SHIPMENTS OVERVIEW")}
            </p>
            <span className="text-xs text-slate-400">This Week</span>
          </div>
          <DonutChart
            centerValue={totalShipments}
            centerLabel="Total"
            data={[
              { label: "Delivered", value: delivered, color: "#16a34a" },
              { label: "In Transit", value: inTransit, color: "#2563eb" },
              { label: "At Delivery Side", value: atDelivery, color: "#7c3aed" },
              { label: "Pending", value: pending, color: "#ef4444" },
            ]}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">{tr("FLEET STATUS")}</p>
            <span className="text-xs text-slate-400">All Fleet</span>
          </div>
          <DonutChart
            centerValue={totalVehicles}
            centerLabel="Total"
            data={[
              { label: "On Trip", value: onTrip, color: "#2563eb" },
              { label: "Available", value: available, color: "#16a34a" },
              { label: "Maintenance", value: maintenance, color: "#ef4444" },
              { label: "Offline", value: offline, color: "#94a3b8" },
            ]}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              {tr("ON TIME PERFORMANCE")}
            </p>
            <span className="text-xs text-slate-400">This Month</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{onTimePct}%</p>
          <p className="text-xs text-slate-400">{tr("On Time Deliveries")}</p>
          <div className="mt-2">
            <TrendLine data={seededTrend(3, onTimePct)} color="#16a34a" height={90} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">{tr("RECENT ALERTS")}</p>
          </div>
          <ul className="space-y-3">
            {alerts.length === 0 && <p className="text-sm text-slate-400">No recent alerts</p>}
            {alerts.map((a) => (
              <li key={a.id} className="flex gap-2 text-sm">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    a.severity === "CRITICAL"
                      ? "bg-red-500"
                      : a.severity === "WARNING"
                        ? "bg-amber-500"
                        : "bg-sky-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-slate-700">{a.message}</p>
                  <p className="text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/logistics-cycle"
            className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-brand-600 hover:underline"
          >
            {tr("View All Alerts")} →
          </Link>
        </div>
      </div>

      {allTrips.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              {tr("ALL ACTIVE TRIPS")} ({allTrips.length})
            </p>
            <Link href="/map-tracking" className="text-xs font-medium text-brand-600 hover:underline">
              {tr("Open Full Map")} →
            </Link>
          </div>
          <LiveMap trips={allTrips} height={320} />
        </div>
      )}
    </div>
  );
}
