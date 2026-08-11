import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Phone, Star } from "lucide-react";
import { db } from "@/lib/db";
import { updateDriver, deleteDriver } from "@/lib/actions/drivers";
import DriverFormFields from "@/components/drivers/driver-form-fields";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { Avatar } from "@/components/ui/avatar";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [driver, vehicles] = await Promise.all([
    db.driver.findUnique({
      where: { id },
      include: { trips: { orderBy: { createdAt: "desc" }, take: 5 } },
    }),
    db.vehicle.findMany({ orderBy: { plateNumber: "asc" } }),
  ]);
  if (!driver) notFound();

  const action = updateDriver.bind(null, id);
  const del = deleteDriver.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/drivers" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Drivers
        </Link>
        <form action={del}>
          <ConfirmSubmitButton
            message="Remove this driver?"
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Remove
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <Avatar name={driver.name} size={56} />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{driver.name}</h2>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)} rating
          </p>
          <a href={`tel:${driver.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
            <Phone size={12} /> {driver.phone}
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">EDIT DRIVER</p>
        <form action={action} className="space-y-5">
          <DriverFormFields
            vehicles={vehicles}
            defaults={{
              name: driver.name,
              phone: driver.phone,
              email: driver.email,
              licenseNumber: driver.licenseNumber,
              status: driver.status,
              vehicleId: driver.vehicleId,
            }}
          />
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">RECENT TRIPS</p>
        {driver.trips.length === 0 ? (
          <p className="text-sm text-slate-400">No trips recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {driver.trips.map((t) => (
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
