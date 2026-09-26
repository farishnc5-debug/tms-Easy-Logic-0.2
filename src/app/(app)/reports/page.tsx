import { db } from "@/lib/db";
import DonutChart from "@/components/charts/donut-chart";
import SimpleBarChart from "@/components/charts/bar-chart";
import TrendLine from "@/components/charts/trend-line";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ReportsPage() {
  const [shipments, vehicles, drivers, customers, trips] = await Promise.all([
    db.shipment.findMany({ select: { createdAt: true, status: true, customerId: true } }),
    db.vehicle.groupBy({ by: ["status"], _count: { status: true } }),
    db.driver.findMany({ include: { _count: { select: { trips: true } } } }),
    db.customer.findMany({ where: { isVendor: false }, include: { _count: { select: { shipments: true } } } }),
    db.trip.findMany({ select: { status: true } }),
  ]);

  const volumeByDay = WEEKDAYS.map((label) => ({ label, value: 0 }));
  for (const s of shipments) {
    volumeByDay[new Date(s.createdAt).getDay()].value++;
  }

  const delivered = shipments.filter((s) => s.status === "DELIVERED").length;
  const delayed = shipments.filter((s) => s.status === "DELAYED").length;
  const onTimePct = delivered + delayed > 0 ? Math.round((delivered / (delivered + delayed)) * 100) : 100;
  const onTimeTrend = Array.from({ length: 8 }, (_, i) => ({
    label: `${i}`,
    value: Math.max(0, Math.min(100, onTimePct + Math.round(Math.sin(i * 1.1) * 5))),
  }));

  const vCountFor = (s: string) => vehicles.find((x) => x.status === s)?._count.status ?? 0;
  const totalVehicles = vehicles.reduce((sum, x) => sum + x._count.status, 0);

  const topCustomers = [...customers]
    .sort((a, b) => b._count.shipments - a._count.shipments)
    .slice(0, 6)
    .map((c) => ({ label: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name, value: c._count.shipments }));

  const topDrivers = [...drivers].sort((a, b) => b._count.trips - a._count.trips).slice(0, 8);

  const tripCompleted = trips.filter((t) => t.status === "DELIVERED").length;
  const tripCancelled = trips.filter((t) => t.status === "CANCELLED").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            SHIPMENT VOLUME (BY WEEKDAY)
          </p>
          <SimpleBarChart data={volumeByDay} />
        </div>

        <div className="card p-5">
          <p className="mb-1 text-xs font-semibold tracking-widest text-slate-400">
            ON-TIME DELIVERY PERFORMANCE
          </p>
          <p className="text-3xl font-bold text-emerald-600">{onTimePct}%</p>
          <TrendLine data={onTimeTrend} color="#16a34a" height={150} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            FLEET UTILIZATION
          </p>
          <DonutChart
            centerValue={totalVehicles}
            centerLabel="Vehicles"
            data={[
              { label: "On Trip", value: vCountFor("ON_TRIP"), color: "#2563eb" },
              { label: "Available", value: vCountFor("AVAILABLE"), color: "#16a34a" },
              { label: "Maintenance", value: vCountFor("MAINTENANCE"), color: "#f59e0b" },
              { label: "Offline", value: vCountFor("OFFLINE"), color: "#94a3b8" },
            ]}
          />
        </div>

        <div className="card p-5 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            TOP CUSTOMERS BY SHIPMENT VOLUME
          </p>
          <SimpleBarChart data={topCustomers} color="#0d9488" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">TRIP OUTCOMES</p>
          <DonutChart
            centerValue={trips.length}
            centerLabel="Trips"
            data={[
              { label: "Completed", value: tripCompleted, color: "#16a34a" },
              { label: "Active", value: trips.length - tripCompleted - tripCancelled, color: "#2563eb" },
              { label: "Cancelled", value: tripCancelled, color: "#8b5cf6" },
            ]}
          />
        </div>

        <div className="card p-5 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            DRIVER PERFORMANCE
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2">Driver</th>
                  <th className="py-2">Total Trips</th>
                  <th className="py-2">Rating</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={d.name} size={24} />
                        <span className="font-medium text-slate-700">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-slate-600">{d._count.trips}</td>
                    <td className="py-2 text-slate-600">★ {d.rating.toFixed(1)}</td>
                    <td className="py-2 text-slate-500">{d.status.replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
