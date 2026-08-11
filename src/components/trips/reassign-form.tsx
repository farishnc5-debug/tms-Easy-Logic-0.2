"use client";

import { useTransition } from "react";
import { assignDriverVehicle } from "@/lib/actions/trips";

export default function ReassignForm({
  tripId,
  currentDriverId,
  currentVehicleId,
  drivers,
  vehicles,
}: {
  tripId: string;
  currentDriverId: string | null;
  currentVehicleId: string | null;
  drivers: { id: string; name: string }[];
  vehicles: { id: string; plateNumber: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const driverId = String(form.get("driverId"));
        const vehicleId = String(form.get("vehicleId"));
        startTransition(() => assignDriverVehicle(tripId, driverId, vehicleId));
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <select
        name="driverId"
        defaultValue={currentDriverId ?? ""}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
      >
        <option value="" disabled>
          Select driver
        </option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <select
        name="vehicleId"
        defaultValue={currentVehicleId ?? ""}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
      >
        <option value="" disabled>
          Select vehicle
        </option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.plateNumber}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Reassign"}
      </button>
    </form>
  );
}
