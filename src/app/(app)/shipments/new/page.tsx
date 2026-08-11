import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { createShipment } from "@/lib/actions/shipments";
import ShipmentFormFields from "@/components/shipments/shipment-form-fields";

export default async function NewShipmentPage() {
  const customers = await db.customer.findMany({
    where: { isVendor: false },
    include: { rates: { orderBy: { createdAt: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/shipments" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Shipments
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">New Shipment</h2>
        <p className="mb-5 text-sm text-slate-500">
          Create a shipment order. Assign a driver and vehicle afterwards from Dispatching.
        </p>
        <form action={createShipment} className="space-y-5">
          <ShipmentFormFields customers={customers} />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              href="/shipments"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
