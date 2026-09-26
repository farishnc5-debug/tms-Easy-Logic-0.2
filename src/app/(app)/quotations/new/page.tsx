import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { createQuotation } from "@/lib/actions/quotations";
import QuotationCustomerFields from "@/components/quotations/customer-fields";

const VEHICLE_TYPES = [
  "Trailer 40FT (Flatbed)",
  "Trailer 40FT (Curtain Side)",
  "Refrigerated Trailer",
  "Box Truck",
  "Lowbed Trailer",
  "Tanker",
  "Van",
];

export default async function NewQuotationPage() {
  const customers = await db.customer.findMany({
    where: { isVendor: false },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/quotations" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Quotations
      </Link>
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">New Quotation</h2>
        <p className="mb-5 text-sm text-slate-500">
          Prepare a transport price quotation. It can be printed with the full company letterhead.
        </p>

        <form action={createQuotation} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuotationCustomerFields customers={customers.map((c) => ({ id: c.id, name: c.name, company: c.company }))} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Loading Point (Origin)</label>
              <input
                name="originName"
                required
                placeholder="e.g. Jeddah Islamic Port"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Point (Destination)</label>
              <input
                name="destinationName"
                required
                placeholder="e.g. Riyadh Dry Port"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Trip Type</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50">
                  <input type="radio" name="tripType" value="ONE_WAY" defaultChecked className="mt-0.5" />
                  <span>
                    <span className="font-medium text-slate-800">One Way</span>
                    <span className="block text-xs text-slate-500">
                      Loading point → destination only
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50">
                  <input type="radio" name="tripType" value="ROUND_TRIP" className="mt-0.5" />
                  <span>
                    <span className="font-medium text-slate-800">Round Trip</span>
                    <span className="block text-xs text-slate-500">
                      Loading → destination unloading → return empty
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vehicle / Equipment Type</label>
              <input
                name="vehicleType"
                list="vehicle-types"
                placeholder="e.g. Trailer 40FT (Flatbed)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <datalist id="vehicle-types">
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cargo Weight (kg, optional)</label>
              <input
                type="number"
                name="weightKg"
                min={0}
                step="0.1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Cargo Description</label>
              <input
                name="cargoDescription"
                placeholder="e.g. General cargo / Steel coils / 1x40FT container"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Price (SAR, excl. VAT)</label>
              <input
                type="number"
                name="priceAmount"
                required
                min={0}
                step="0.01"
                placeholder="e.g. 3500"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">VAT %</label>
                <input
                  type="number"
                  name="vatPct"
                  defaultValue={15}
                  min={0}
                  step="0.5"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Valid (days)</label>
                <input
                  type="number"
                  name="validDays"
                  defaultValue={15}
                  min={1}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes / Special Terms</label>
              <textarea
                name="notes"
                rows={3}
                placeholder="e.g. Price includes loading assistance. Waiting time charged after 4 hours..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              href="/quotations"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
