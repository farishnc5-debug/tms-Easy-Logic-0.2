import Link from "next/link";
import { TruckIcon, CheckCircle2, Wrench, PowerOff, Plus, Eye } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const vehicles = await db.vehicle.findMany({
    include: { drivers: true, trips: { where: { status: { in: ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "RETURN_TRANSIT", "AT_RETURN"] } }, take: 1 } },
    orderBy: { plateNumber: "asc" },
  });

  const countFor = (s: string) => vehicles.filter((v) => v.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/fleet/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> {tr("New Vehicle")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={TruckIcon} label={tr("Total Fleet")} value={vehicles.length} color="#ea580c" />
        <StatCard icon={CheckCircle2} label={tr("Available")} value={countFor("AVAILABLE")} color="#16a34a" />
        <StatCard icon={Wrench} label={tr("Maintenance")} value={countFor("MAINTENANCE")} color="#f59e0b" />
        <StatCard icon={PowerOff} label={tr("Offline")} value={countFor("OFFLINE")} color="#94a3b8" />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-start text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">{tr("Plate Number")}</th>
                <th className="px-4 py-3">{tr("Type")}</th>
                <th className="px-4 py-3">{tr("Capacity")}</th>
                <th className="px-4 py-3">{tr("Status")}</th>
                <th className="px-4 py-3">{tr("Assigned Driver")}</th>
                <th className="px-4 py-3">{tr("Active Trip")}</th>
                <th className="px-4 py-3 text-end">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{v.plateNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{v.vehicleType}</td>
                  <td className="px-4 py-3 text-slate-600">{v.capacityTon ? `${v.capacityTon}T` : "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {v.drivers[0]?.name ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {v.trips[0] ? (
                      <Link href={`/trips/${v.trips[0].id}`} className="text-brand-600 hover:underline">
                        {v.trips[0].code}
                      </Link>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/fleet/${v.id}`}
                      className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
