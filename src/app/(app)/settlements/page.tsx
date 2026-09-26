import Link from "next/link";
import { Banknote, Inbox, Landmark, FileText, BadgeDollarSign, Eye } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { Pill } from "@/components/ui/badge";
import Pagination from "@/components/ui/pagination";
import { fmtDate, nowMs } from "@/lib/format";
import { settlementStageOf, SETTLEMENT_STATUS_LABELS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const TABS = [
  { key: "all", label: "All", statuses: null as string[] | null },
  { key: "docs", label: "Awaiting Originals", statuses: ["DOCS_WITH_DRIVER"] },
  { key: "yard", label: "In Yard", statuses: ["DOCS_IN_YARD"] },
  { key: "accounts", label: "With Accounts", statuses: ["WITH_ACCOUNTS"] },
  { key: "invoiced", label: "Invoiced", statuses: ["INVOICED"] },
  { key: "paid", label: "Paid & Closed", statuses: ["PAID"] },
];

const STAGE_DOT_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-green-600",
];

function StageDots({ stage }: { stage: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
            n <= stage ? `${STAGE_DOT_COLORS[n - 1]} text-white` : "bg-slate-200 text-slate-400"
          }`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const tab = typeof sp.tab === "string" ? sp.tab : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const activeTab = TABS.find((x) => x.key === tab) ?? TABS[0];

  // Delivered shipments enter the follow-up automatically; settlements are
  // created on delivery, but older data may miss one — treat missing as stage 1.
  const where = {
    status: "DELIVERED",
    ...(activeTab.statuses
      ? activeTab.statuses.includes("DOCS_WITH_DRIVER")
        ? { OR: [{ settlement: { is: null } }, { settlement: { status: { in: activeTab.statuses } } }] }
        : { settlement: { status: { in: activeTab.statuses } } }
      : {}),
  };

  const [total, shipments, counts] = await Promise.all([
    db.shipment.count({ where }),
    db.shipment.findMany({
      where,
      include: {
        customer: true,
        trip: true,
        settlement: { include: { invoice: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.settlement.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const deliveredTotal = await db.shipment.count({ where: { status: "DELIVERED" } });
  const countFor = (s: string) => counts.find((c) => c.status === s)?._count.status ?? 0;
  const awaitingDocs = deliveredTotal - counts.reduce((sum, c) => sum + c._count.status, 0) + countFor("DOCS_WITH_DRIVER");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const now = nowMs();

  const buildTabHref = (key: string) =>
    key === "all" ? "/settlements" : `/settlements?tab=${key}`;
  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (p > 1) params.set("page", String(p));
    return `/settlements${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard icon={Banknote} label={tr("Awaiting Originals")} value={awaitingDocs} color="#16a34a" />
        <StatCard icon={Inbox} label={tr("Originals in Yard")} value={countFor("DOCS_IN_YARD")} color="#0284c7" />
        <StatCard icon={Landmark} label={tr("With Accounts")} value={countFor("WITH_ACCOUNTS")} color="#0d9488" />
        <StatCard icon={FileText} label={tr("Invoiced")} value={countFor("INVOICED")} color="#f97316" />
        <StatCard icon={BadgeDollarSign} label={tr("Paid & Closed")} value={countFor("PAID")} color="#16a34a" />
      </div>

      <div className="card">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-3">
          {TABS.map((tabItem) => (
            <Link
              key={tabItem.key}
              href={buildTabHref(tabItem.key)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium ${
                activeTab.key === tabItem.key
                  ? "border-b-2 border-brand-600 text-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tr(tabItem.label)}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">{tr("Shipment")}</th>
                <th className="px-4 py-3">{tr("Customer")}</th>
                <th className="px-4 py-3">{tr("Delivered")}</th>
                <th className="px-4 py-3">{tr("Terms")}</th>
                <th className="px-4 py-3">{tr("Follow-up Stage")}</th>
                <th className="px-4 py-3">{tr("Invoice")}</th>
                <th className="px-4 py-3">{tr("Due")}</th>
                <th className="px-4 py-3 text-end">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const st = s.settlement;
                const stage = st ? settlementStageOf(st.status) : 1;
                const overdue =
                  st?.paymentDueAt && st.status === "INVOICED" && st.paymentDueAt.getTime() < now;
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/settlements/${s.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {s.code}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {s.originName} → {s.destinationName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{s.customer.name}</p>
                      <p className="text-xs text-slate-400">{s.customer.contactPerson}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDate(s.trip?.deliveredAt ?? s.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Pill
                        className={
                          (st?.paymentTerms ?? s.customer.paymentTerms) === "CREDIT"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-emerald-50 text-emerald-700"
                        }
                      >
                        {(st?.paymentTerms ?? s.customer.paymentTerms) === "CREDIT"
                          ? `Credit ${st?.creditDays ?? s.customer.creditDays ?? ""} days`
                          : "Cash"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      <StageDots stage={stage} />
                      <p className="mt-1 text-[10px] text-slate-400">
                        {SETTLEMENT_STATUS_LABELS[st?.status ?? "DOCS_WITH_DRIVER"]}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {st?.invoice ? (
                        <Link
                          href={`/print/invoice/${st.invoice.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {st.invoice.code}
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {st?.paymentDueAt ? (
                        <span className={overdue ? "font-semibold text-red-600" : "text-slate-600"}>
                          {fmtDate(st.paymentDueAt)}
                          {overdue ? " · OVERDUE" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/settlements/${s.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Open follow-up"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    No delivered shipments in this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          buildHref={buildPageHref}
        />
      </div>
    </div>
  );
}
