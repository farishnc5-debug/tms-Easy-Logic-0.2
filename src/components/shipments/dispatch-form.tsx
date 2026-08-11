"use client";

import { useState } from "react";
import { dispatchShipment } from "@/lib/actions/shipments";

export type DispatchDriver = {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleId: string | null;
};
export type DispatchVehicle = {
  id: string;
  plateNumber: string;
  vehicleType: string;
  status: string;
};

export default function DispatchForm({
  shipmentId,
  drivers,
  vehicles,
}: {
  shipmentId: string;
  drivers: DispatchDriver[];
  vehicles: DispatchVehicle[];
}) {
  const [manual, setManual] = useState(false);
  const [vehicleId, setVehicleId] = useState("");

  function onDriverChange(driverId: string) {
    // auto-link the driver's registered truck
    const driver = drivers.find((d) => d.id === driverId);
    if (driver?.vehicleId && vehicles.some((v) => v.id === driver.vehicleId)) {
      setVehicleId(driver.vehicleId);
    }
  }

  return (
    <form action={dispatchShipment} className="space-y-3">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="manualMode" value={manual ? "1" : ""} />

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <input
          type="checkbox"
          checked={manual}
          onChange={(e) => setManual(e.target.checked)}
        />
        <span>
          <span className="font-medium">Manual selection</span>
          <span className="block text-xs text-slate-500">
            Driver or truck not registered in the system? Enter their details by hand.
          </span>
        </span>
      </label>

      {!manual ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Driver</label>
            <select
              name="driverId"
              required
              defaultValue=""
              onChange={(e) => onDriverChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option value="" disabled>
                Select available driver
              </option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.rating.toFixed(1)}★
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No drivers currently available — use manual selection.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Vehicle <span className="font-normal text-slate-400">(auto-linked to driver)</span>
            </label>
            <select
              name="vehicleId"
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option value="" disabled>
                Select available vehicle
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} · {v.vehicleType}
                  {v.status !== "AVAILABLE" ? ` (${v.status.toLowerCase().replace("_", " ")})` : ""}
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No vehicles currently available — use manual selection.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Driver Name</label>
            <input
              name="manualDriverName"
              required
              placeholder="e.g. Abdullah Al-Otaibi"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Driver Phone <span className="font-normal text-slate-400">(shown on waybill)</span>
            </label>
            <input
              name="manualDriverPhone"
              required
              placeholder="+966 5X XXX XXXX"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Truck Model / Plate
            </label>
            <input
              name="manualVehicle"
              required
              placeholder="e.g. Mercedes Actros - XYZ 1234"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Driver Allowance / Trip Money (SAR){" "}
          <span className="font-normal text-slate-400">(optional — can be marked paid later)</span>
        </label>
        <input
          type="number"
          name="driverAllowance"
          min={0}
          step="0.01"
          placeholder="e.g. 1500"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
      </div>

      <button
        type="submit"
        disabled={!manual && (drivers.length === 0 || vehicles.length === 0)}
        className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Dispatch Shipment
      </button>
    </form>
  );
}
