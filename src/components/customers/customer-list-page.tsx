import Link from "next/link";
import { Users, Building2, Package, Plus } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export default async function CustomerListPage({ isVendor }: { isVendor: boolean }) {
  const base = isVendor ? "/vendors" : "/customers";
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const customers = await db.customer.findMany({
    where: { isVendor },
    include: { _count: { select: { shipments: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`${base}/new`}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> {tr(isVendor ? "New Vendor" : "New Customer")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          icon={isVendor ? Building2 : Users}
          label={tr(isVendor ? "Total Vendors" : "Total Customers")}
          value={customers.length}
          color="#ea580c"
        />
        <StatCard
          icon={Package}
          label={tr("Total Shipments")}
          value={customers.reduce((sum, c) => sum + c._count.shipments, 0)}
          color="#16a34a"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`${base}/${c.id}`}
            className="card p-4 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{c.name}</p>
                <p className="truncate text-xs text-slate-400">{c.company}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>{c.phone}</p>
              <p className="truncate">{c.address}</p>
            </div>
            {!isVendor && (
              <p className="mt-2 text-xs font-medium text-brand-600">
                {c._count.shipments} shipment{c._count.shipments === 1 ? "" : "s"}
              </p>
            )}
          </Link>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="card p-12 text-center text-sm text-slate-400">
          No {isVendor ? "vendors" : "customers"} yet.
        </div>
      )}
    </div>
  );
}
