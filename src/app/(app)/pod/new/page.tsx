import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { createPod } from "@/lib/actions/pod";

export default async function NewPodPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const defaultShipmentId = typeof sp.shipmentId === "string" ? sp.shipmentId : "";

  const shipments = await db.shipment.findMany({
    where: { pod: null, status: { not: "CANCELLED" } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/pod" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to POD & Proof
      </Link>
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Upload Proof of Delivery</h2>
        <p className="mb-5 text-sm text-slate-500">
          Confirming delivery will mark the shipment and trip as Delivered.
        </p>
        <form action={createPod} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Shipment</label>
            <select
              name="shipmentId"
              required
              defaultValue={defaultShipmentId}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option value="" disabled>
                Select shipment
              </option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.customer.name} · {s.destinationName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Received By</label>
            <input
              name="receivedBy"
              required
              placeholder="e.g. Warehouse Supervisor"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Photo (optional)</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Condition of goods, pallet count, etc."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link href="/pod" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Confirm Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
