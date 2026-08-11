import Link from "next/link";
import { Wrench, Gauge, AlertTriangle, CheckCircle2, Satellite } from "lucide-react";
import { db } from "@/lib/db";
import { Pill } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { FAW_PLAN, KM_LEVELS, computeDueServices } from "@/lib/maintenance-plan";
import { updateOdometer, logService } from "@/lib/actions/maintenance";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

function kmFmt(km: number | null | undefined) {
  return km == null ? "—" : `${Math.round(km).toLocaleString()} km`;
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const tr = (key: string) => t(key, locale);
  const selectedId = typeof sp.v === "string" ? sp.v : "";

  const vehicles = await db.vehicle.findMany({
    orderBy: { plateNumber: "asc" },
    include: {
      maintenance: { orderBy: { performedAt: "desc" } },
      gpsDevice: true,
    },
  });

  // Per-truck maintenance status from the FAW interval plan
  const rows = vehicles.map((v) => {
    const lastByCode: Record<string, number> = {};
    for (const rec of v.maintenance) {
      if (lastByCode[rec.serviceCode] == null || rec.odometerKm > lastByCode[rec.serviceCode]) {
        lastByCode[rec.serviceCode] = rec.odometerKm;
      }
    }
    const due = v.odometerKm != null ? computeDueServices(v.odometerKm, lastByCode) : [];
    const next = due[0] ?? null;
    const overdue = due.filter((d) => d.kmRemaining < 0);
    return { v, next, overdue, due };
  });

  const overdueCount = rows.filter((r) => r.overdue.length > 0).length;
  const dueSoonCount = rows.filter(
    (r) => r.overdue.length === 0 && r.next && r.next.kmRemaining <= 2000,
  ).length;
  const selected = rows.find((r) => r.v.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Wrench size={18} className="text-slate-500" />
          <span className="text-sm text-slate-600">
            {tr("FAW JH6 (2025) preventive maintenance plan — services fall due by kilometer interval.")}
          </span>
        </div>
        <Pill className="bg-red-50 text-red-700">
          {overdueCount} {tr("overdue")}
        </Pill>
        <Pill className="bg-amber-50 text-amber-700">
          {dueSoonCount} {tr("due within 2,000 km")}
        </Pill>
      </div>

      {/* Fleet maintenance board */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">{tr("Truck")}</th>
              <th className="px-4 py-3">{tr("Odometer")}</th>
              <th className="px-4 py-3">{tr("Next Service Due")}</th>
              <th className="px-4 py-3">{tr("Status")}</th>
              <th className="px-4 py-3">{tr("Update KM")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ v, next, overdue }) => {
              const state =
                v.odometerKm == null
                  ? "noKm"
                  : overdue.length > 0
                    ? "overdue"
                    : next && next.kmRemaining <= 2000
                      ? "soon"
                      : "ok";
              return (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{v.plateNumber}</p>
                    <p className="text-xs text-slate-400">
                      {v.makeModel ?? v.vehicleType}
                      {v.gpsDevice && (
                        <span className="ms-1 inline-flex items-center gap-0.5 text-emerald-600">
                          <Satellite size={10} /> GPS
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{kmFmt(v.odometerKm)}</p>
                    {v.odometerUpdatedAt && (
                      <p className="text-[10px] text-slate-400">
                        updated {fmtDate(v.odometerUpdatedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {v.odometerKm == null ? (
                      <span className="text-xs text-slate-400">{tr("Enter odometer first")}</span>
                    ) : next ? (
                      <>
                        <p className="font-medium text-slate-700">
                          {next.code} — {next.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          at {kmFmt(next.dueAtKm)}
                          {next.kmRemaining >= 0
                            ? ` · in ${kmFmt(next.kmRemaining)}`
                            : ` · ${kmFmt(-next.kmRemaining)} OVERDUE`}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {state === "overdue" && (
                      <Pill className="bg-red-50 text-red-700">
                        <AlertTriangle size={11} className="me-1" /> {tr("OVERDUE")} ({overdue.length})
                      </Pill>
                    )}
                    {state === "soon" && (
                      <Pill className="bg-amber-50 text-amber-700">{tr("DUE SOON")}</Pill>
                    )}
                    {state === "ok" && (
                      <Pill className="bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={11} className="me-1" /> {tr("OK")}
                      </Pill>
                    )}
                    {state === "noKm" && <Pill className="bg-slate-100 text-slate-500">{tr("NO KM")}</Pill>}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateOdometer} className="flex items-center gap-1.5">
                      <input type="hidden" name="vehicleId" value={v.id} />
                      <input
                        type="number"
                        name="odometerKm"
                        min={0}
                        defaultValue={v.odometerKm ?? ""}
                        placeholder="km"
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-sky-400"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                        title="Save odometer reading"
                      >
                        <Gauge size={14} />
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/maintenance?v=${v.id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        selectedId === v.id
                          ? "bg-brand-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tr("Details")}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No vehicles in the fleet yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Selected truck: due list, log-service form, history, FAW plan reference */}
      {selected && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
                {selected.v.plateNumber} — SERVICE SCHEDULE (FAW PLAN)
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2">{tr("Service")}</th>
                    <th className="py-2">{tr("Interval")}</th>
                    <th className="py-2">{tr("Last Done")}</th>
                    <th className="py-2">{tr("Due At")}</th>
                    <th className="py-2">{tr("Remaining KM")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.due.map((d) => (
                    <tr key={d.code} className="border-t border-slate-50">
                      <td className="py-2 font-medium text-slate-700">
                        {d.code} · {d.label}
                      </td>
                      <td className="py-2 text-slate-500">{kmFmt(d.intervalKm)}</td>
                      <td className="py-2 text-slate-500">{d.lastAtKm != null ? kmFmt(d.lastAtKm) : "never"}</td>
                      <td className="py-2 text-slate-500">{kmFmt(d.dueAtKm)}</td>
                      <td className={`py-2 font-medium ${d.kmRemaining < 0 ? "text-red-600" : d.kmRemaining <= 2000 ? "text-amber-600" : "text-emerald-600"}`}>
                        {d.kmRemaining < 0 ? `${kmFmt(-d.kmRemaining)} overdue` : kmFmt(d.kmRemaining)}
                      </td>
                    </tr>
                  ))}
                  {selected.due.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Enter the truck&apos;s odometer reading to compute the schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
                {tr("SERVICE HISTORY")}
              </p>
              {selected.v.maintenance.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No services recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.v.maintenance.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{m.serviceCode}</span>
                        <span className="ms-2 text-slate-500">at {kmFmt(m.odometerKm)}</span>
                        <span className="ms-2 text-xs text-slate-400">{fmtDate(m.performedAt)}</span>
                        {m.workshop && <span className="ms-2 text-xs text-slate-400">· {m.workshop}</span>}
                      </div>
                      {m.costSar != null && (
                        <span className="text-xs font-medium text-slate-600">
                          SAR {m.costSar.toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
                {tr("LOG COMPLETED SERVICE")}
              </p>
              <form action={logService} className="space-y-2.5">
                <input type="hidden" name="vehicleId" value={selected.v.id} />
                <select
                  name="serviceCode"
                  required
                  defaultValue={selected.next?.code ?? "PM-C"}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                >
                  {KM_LEVELS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="odometerKm"
                  required
                  min={0}
                  defaultValue={selected.v.odometerKm ?? ""}
                  placeholder="Odometer at service (km)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                <input
                  name="workshop"
                  placeholder="Workshop (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                <input
                  type="number"
                  name="costSar"
                  min={0}
                  step="0.01"
                  placeholder="Cost SAR (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Notes (parts replaced, findings...)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  {tr("Record Service")}
                </button>
              </form>
            </div>

            {/* FAW checklist for the most urgent service */}
            {selected.next && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-2 text-xs font-semibold tracking-widest text-slate-400">
                  {selected.next.code} CHECKLIST — {selected.next.label.toUpperCase()}
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {FAW_PLAN.find((p) => p.code === selected.next!.code)?.tasks.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded border border-slate-300" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily inspection reference */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-xs font-semibold tracking-widest text-slate-400">
          PM-A — DAILY INSPECTION (DRIVER SIGNS BEFORE DISPATCH)
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          {FAW_PLAN[0].tasks.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-slate-300" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
