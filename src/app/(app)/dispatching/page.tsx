import Link from "next/link";
import { Send, Package, Users, TruckIcon } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import DispatchForm from "@/components/shipments/dispatch-form";
import { Pill } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function DispatchingPage() {
  const [pendingShipments, availableDrivers, availableVehicles] = await Promise.all([
    db.shipment.findMany({
      where: { status: "PENDING" },
      include: { customer: true },
      orderBy: { createdAt: "asc" },
    }),
    db.driver.findMany({ where: { status: "AVAILABLE" }, orderBy: { rating: "desc" } }),
    db.vehicle.findMany({ where: { status: "AVAILABLE" }, orderBy: { plateNumber: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Package} label="Awaiting Dispatch" value={pendingShipments.length} color="#f59e0b" />
        <StatCard icon={Users} label="Available Drivers" value={availableDrivers.length} color="#16a34a" />
        <StatCard icon={TruckIcon} label="Available Vehicles" value={availableVehicles.length} color="#ea580c" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-slate-400" />
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              PENDING DISPATCH QUEUE
            </p>
          </div>
          {pendingShipments.length === 0 ? (
            <div className="card p-12 text-center text-sm text-slate-400">
              All shipments are dispatched. Nothing waiting.
            </div>
          ) : (
            pendingShipments.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                      {s.code}
                    </Link>
                    <Pill className="ml-2 bg-slate-100 text-slate-500">{s.priority}</Pill>
                  </div>
                  <p className="text-sm text-slate-500">
                    {s.originName} → {s.destinationName}
                  </p>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Avatar name={s.customer.name} size={22} />
                  <span className="text-sm text-slate-600">{s.customer.name}</span>
                  {s.weightKg && <span className="text-xs text-slate-400">· {s.weightKg} kg</span>}
                </div>
                <DispatchForm shipmentId={s.id} drivers={availableDrivers} vehicles={availableVehicles} />
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
              AVAILABLE DRIVERS
            </p>
            {availableDrivers.length === 0 ? (
              <p className="text-sm text-slate-400">No drivers available right now.</p>
            ) : (
              <ul className="space-y-2">
                {availableDrivers.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <Avatar name={d.name} size={28} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/drivers/${d.id}`} className="truncate text-sm font-medium text-slate-700 hover:text-brand-600">
                        {d.name}
                      </Link>
                      <p className="text-xs text-slate-400">★ {d.rating.toFixed(1)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
              AVAILABLE VEHICLES
            </p>
            {availableVehicles.length === 0 ? (
              <p className="text-sm text-slate-400">No vehicles available right now.</p>
            ) : (
              <ul className="space-y-2">
                {availableVehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between">
                    <Link href={`/fleet/${v.id}`} className="text-sm font-medium text-slate-700 hover:text-brand-600">
                      {v.plateNumber}
                    </Link>
                    <span className="text-xs text-slate-400">{v.vehicleType}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
