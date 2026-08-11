import { VEHICLE_STATUSES } from "@/lib/constants";

export default function VehicleFormFields({
  defaults,
}: {
  defaults?: {
    plateNumber?: string;
    vehicleType?: string;
    capacityTon?: number | null;
    status?: string;
    notes?: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Plate Number</label>
        <input
          name="plateNumber"
          required
          defaultValue={defaults?.plateNumber ?? ""}
          placeholder="e.g. KSA-1234"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle Type</label>
        <input
          name="vehicleType"
          required
          defaultValue={defaults?.vehicleType ?? ""}
          placeholder="e.g. Trailer 40FT"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Capacity (tons)</label>
        <input
          type="number"
          name="capacityTon"
          min={0}
          step="0.5"
          defaultValue={defaults?.capacityTon ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={defaults?.status ?? "AVAILABLE"}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
    </div>
  );
}
