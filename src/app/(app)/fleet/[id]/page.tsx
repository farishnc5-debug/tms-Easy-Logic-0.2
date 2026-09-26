import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { updateVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import VehicleFormFields from "@/components/fleet/vehicle-form-fields";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { Avatar } from "@/components/ui/avatar";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      drivers: true,
      trips: { orderBy: { createdAt: "desc" }, take: 5, include: { shipment: true } },
    },
  });
  if (!vehicle) notFound();

  const action = updateVehicle.bind(null, id);
  const del = deleteVehicle.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/fleet" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Fleet
        </Link>
        <form action={del}>
          <ConfirmSubmitButton
            message="Remove this vehicle from the fleet?"
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Remove
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">{vehicle.plateNumber}</h2>
        <p className="mb-5 text-sm text-slate-500">{vehicle.vehicleType}</p>
        <form action={action} className="space-y-5">
          <VehicleFormFields
            defaults={{
              plateNumber: vehicle.plateNumber,
              vehicleType: vehicle.vehicleType,
              capacityTon: vehicle.capacityTon,
              status: vehicle.status,
              notes: vehicle.notes,
            }}
          />
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {vehicle.drivers.length > 0 && (
        <div className="card p-6">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">ASSIGNED DRIVERS</p>
          <ul className="space-y-2">
            {vehicle.drivers.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <Avatar name={d.name} size={28} />
                <Link href={`/drivers/${d.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">RECENT TRIPS</p>
        {vehicle.trips.length === 0 ? (
          <p className="text-sm text-slate-400">No trips recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {vehicle.trips.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <Link href={`/trips/${t.id}`} className="font-medium text-brand-600 hover:underline">
                  {t.code}
                </Link>
                <span className="text-slate-500">
                  {t.originName} → {t.destinationName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
