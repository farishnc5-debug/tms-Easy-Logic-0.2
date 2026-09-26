import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { updateShipment } from "@/lib/actions/shipments";
import ShipmentFormFields from "@/components/shipments/shipment-form-fields";

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [shipment, customers] = await Promise.all([
    db.shipment.findUnique({
      where: { id },
      include: { trip: true, stops: { orderBy: { seq: "asc" } } },
    }),
    db.customer.findMany({
      where: { isVendor: false },
      include: { rates: { orderBy: { createdAt: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!shipment) notFound();
  // Bookings are locked once dispatched — editing is not allowed at all
  if (shipment.trip) redirect(`/shipments/${id}?locked=1`);

  const action = updateShipment.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/shipments/${id}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Shipment
      </Link>
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Edit Shipment {shipment.code}</h2>
        <p className="mb-5 text-sm text-slate-500">Update shipment details.</p>
        <form action={action} className="space-y-5">
          <ShipmentFormFields
            customers={customers}
            defaults={{
              customerId: shipment.customerId,
              originName: shipment.originName,
              destinationName: shipment.destinationName,
              priority: shipment.priority,
              weightKg: shipment.weightKg,
              notes: shipment.notes,
              originAddress: shipment.originAddress,
              destinationAddress: shipment.destinationAddress,
              originX: shipment.originX,
              originY: shipment.originY,
              destX: shipment.destX,
              destY: shipment.destY,
              tripType: shipment.tripType,
              returnName: shipment.returnName,
              returnAddress: shipment.returnAddress,
              returnX: shipment.returnX,
              returnY: shipment.returnY,
              vehicleTypes: shipment.vehicleTypes,
              tempMinC: shipment.tempMinC,
              tempMaxC: shipment.tempMaxC,
              stops: shipment.stops.map((s) => ({
                name: s.name,
                address: s.address ?? "",
                contactName: s.contactName ?? "",
                contactPhone: s.contactPhone ?? "",
                notes: s.notes ?? "",
              })),
            }}
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              href={`/shipments/${id}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
