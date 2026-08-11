import { DRIVER_STATUSES } from "@/lib/constants";

export default function DriverFormFields({
  vehicles,
  defaults,
}: {
  vehicles: { id: string; plateNumber: string }[];
  defaults?: {
    name?: string;
    phone?: string;
    email?: string | null;
    licenseNumber?: string;
    status?: string;
    vehicleId?: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
        <input
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input
          name="phone"
          required
          defaultValue={defaults?.phone ?? ""}
          placeholder="+966 5x xxx xxxx"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          name="email"
          defaultValue={defaults?.email ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">License Number</label>
        <input
          name="licenseNumber"
          required
          defaultValue={defaults?.licenseNumber ?? ""}
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
          {DRIVER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Assigned Vehicle</label>
        <select
          name="vehicleId"
          defaultValue={defaults?.vehicleId ?? ""}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
