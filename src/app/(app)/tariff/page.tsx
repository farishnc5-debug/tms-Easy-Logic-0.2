import Link from "next/link";
import { Route, BadgeCheck, Wallet, Percent, Search } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import LaneRow from "@/components/tariff/lane-row";
import NewLaneForm from "@/components/tariff/new-lane-form";
import CascadingFilters from "@/components/tariff/cascading-filters";
import { fmtDate } from "@/lib/format";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TariffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const vendorId = typeof sp.vendorId === "string" ? sp.vendorId : "";
  const origin = typeof sp.origin === "string" ? sp.origin : "";
  const destination = typeof sp.destination === "string" ? sp.destination : "";
  const vehicleType = typeof sp.vehicleType === "string" ? sp.vehicleType : "";

  const vendors = await db.customer.findMany({
    where: { isVendor: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { vendorRates: true } } },
  });

  // Cascading option lists — each level only shows values that actually exist
  // given everything selected above it.
  const baseWhere = vendorId ? { vendorId } : {};
  const [originsRaw, destRaw, vtypesRaw, lanes] = await Promise.all([
    db.carrierRate.findMany({ where: baseWhere, select: { originCity: true }, distinct: ["originCity"] }),
    db.carrierRate.findMany({
      where: { ...baseWhere, ...(origin ? { originCity: origin } : {}) },
      select: { destinationCity: true },
      distinct: ["destinationCity"],
    }),
    db.carrierRate.findMany({
      where: {
        ...baseWhere,
        ...(origin ? { originCity: origin } : {}),
        ...(destination ? { destinationCity: destination } : {}),
      },
      select: { vehicleType: true },
      distinct: ["vehicleType"],
    }),
    db.carrierRate.findMany({
      where: {
        ...baseWhere,
        ...(origin ? { originCity: origin } : {}),
        ...(destination ? { destinationCity: destination } : {}),
        ...(vehicleType ? { vehicleType } : {}),
      },
      include: { vendor: { select: { name: true } } },
      orderBy: [{ originCity: "asc" }, { destinationCity: "asc" }, { vehicleType: "asc" }],
    }),
  ]);

  const origins = originsRaw.map((o) => o.originCity).sort();
  const destinations = destRaw.map((d) => d.destinationCity).sort();
  const vehicleTypesAvailable = vtypesRaw.map((v) => v.vehicleType).sort();

  const actuals = lanes.filter((l) => l.isActual).length;
  const priced = lanes.filter((l) => l.sellingPrice != null);
  const avgMargin =
    priced.length > 0
      ? priced.reduce(
          (sum, l) => sum + ((l.sellingPrice! - l.carrierCost) / l.sellingPrice!) * 100,
          0,
        ) / priced.length
      : null;

  const exactMatch =
    vendorId && origin && destination && vehicleType && lanes.length === 1 ? lanes[0] : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Route size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Carrier Tariff Book</h2>
          <span dir="rtl" className="ms-auto text-sm font-semibold text-slate-700">
            دفتر أسعار الناقلين
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Rates are <strong>specific to each vendor and each vehicle/equipment type</strong> — the
          same lane can cost differently at different transporters, and differently again for a
          flatbed vs. a reefer at the same transporter. Pick a vendor, then narrow down the lane and
          equipment to find the exact rate.
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          No vendors yet. Add a subcontracted transporter under{" "}
          <Link href="/vendors/new" className="font-semibold underline">
            Vendors & Suppliers
          </Link>{" "}
          first, then come back here to build their rate card.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard icon={Route} label="Lanes Shown" value={lanes.length} color="#2563eb" />
            <StatCard icon={BadgeCheck} label="Confirmed Actuals" value={actuals} color="#16a34a" />
            <StatCard icon={Wallet} label="Lanes Priced for Sale" value={priced.length} color="#7c3aed" />
            <StatCard
              icon={Percent}
              label="Avg. Margin"
              value={avgMargin != null ? `${avgMargin.toFixed(1)}%` : "—"}
              color="#f59e0b"
            />
          </div>

          {/* Cascading Vendor → Origin → Destination → Vehicle Type dropdowns */}
          <CascadingFilters
            vendors={vendors.map((v) => ({ id: v.id, name: v.name, count: v._count.vendorRates }))}
            origins={origins}
            destinations={destinations}
            vehicleTypes={vehicleTypesAvailable.map((code) => ({
              code,
              label: VEHICLE_TYPE_LABELS[code] ?? code,
            }))}
            selected={{ vendorId, origin, destination, vehicleType }}
          />

          {exactMatch && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-emerald-700">
                <Search size={14} /> EXACT MATCH
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                SAR {exactMatch.carrierCost.toLocaleString()}
                <span className="ml-2 text-sm font-medium text-emerald-700">carrier cost</span>
              </p>
              <p className="text-sm text-emerald-800">
                {exactMatch.vendor.name} · {exactMatch.originCity} → {exactMatch.destinationCity} ·{" "}
                {VEHICLE_TYPE_LABELS[exactMatch.vehicleType] ?? exactMatch.vehicleType}
                {exactMatch.sellingPrice != null && (
                  <> · sell at SAR {exactMatch.sellingPrice.toLocaleString()}</>
                )}
              </p>
            </div>
          )}

          <NewLaneForm
            vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
            vehicleTypes={VEHICLE_TYPES.map((v) => ({ code: v.code, label: v.label }))}
            defaultVendorId={vendorId}
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-start text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Lane</th>
                  <th className="px-4 py-3">Vehicle Type</th>
                  <th className="px-4 py-3 text-end">Distance</th>
                  <th className="px-4 py-3 text-end">Carrier Cost</th>
                  <th className="px-4 py-3 text-end">Selling Price</th>
                  <th className="px-4 py-3 text-end">Gross Profit</th>
                  <th className="px-4 py-3 text-end">Margin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {lanes.map((l) => (
                  <LaneRow
                    key={l.id}
                    vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
                    vehicleTypes={VEHICLE_TYPES.map((v) => ({ code: v.code, label: v.label }))}
                    lane={{
                      id: l.id,
                      vendorId: l.vendorId,
                      vendorName: l.vendor.name,
                      originCity: l.originCity,
                      destinationCity: l.destinationCity,
                      vehicleType: l.vehicleType,
                      carrierCost: l.carrierCost,
                      sellingPrice: l.sellingPrice,
                      distanceKm: l.distanceKm,
                      isActual: l.isActual,
                      notes: l.notes,
                      updatedAt: fmtDate(l.updatedAt),
                    }}
                  />
                ))}
                {lanes.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-slate-400">
                      No lanes match this filter yet — add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
