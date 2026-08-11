import Link from "next/link";
import { Users, CheckCircle2, Truck, Moon, Plus, Star } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const drivers = await db.driver.findMany({
    include: { vehicle: true },
    orderBy: { name: "asc" },
  });

  const countFor = (s: string) => drivers.filter((d) => d.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/drivers/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> {tr("New Driver")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label={tr("Total Drivers")} value={drivers.length} color="#2563eb" />
        <StatCard icon={CheckCircle2} label={tr("Available")} value={countFor("AVAILABLE")} color="#16a34a" />
        <StatCard icon={Truck} label={tr("ON TRIP")} value={countFor("ON_TRIP")} color="#0284c7" />
        <StatCard icon={Moon} label={tr("Off Duty")} value={countFor("OFF_DUTY")} color="#94a3b8" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => (
          <Link
            key={d.id}
            href={`/drivers/${d.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar name={d.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{d.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Star size={11} className="fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)}
                </p>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>{d.phone}</p>
              <p>{d.vehicle ? `${d.vehicle.plateNumber} · ${d.vehicle.vehicleType}` : "No vehicle assigned"}</p>
            </div>
          </Link>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No drivers yet.
        </div>
      )}
    </div>
  );
}
