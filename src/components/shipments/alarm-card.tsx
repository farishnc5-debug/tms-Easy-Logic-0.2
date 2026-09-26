import { AlarmClock, Trash2 } from "lucide-react";
import { setShipmentAlarm, clearAlarm } from "@/lib/actions/alarms";
import { fmtDateTime } from "@/lib/format";

export type ShipmentAlarmRow = {
  id: string;
  triggerAt: Date;
  label: string | null;
  status: string;
  snoozedUntil: Date | null;
};

export default function AlarmCard({
  shipmentId,
  alarms,
}: {
  shipmentId: string;
  alarms: ShipmentAlarmRow[];
}) {
  const setAction = setShipmentAlarm.bind(null, shipmentId);
  const active = alarms.filter((a) => a.status !== "DISMISSED");

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <AlarmClock size={14} /> SHIPMENT ALARM
      </p>

      {active.length > 0 && (
        <ul className="mb-3 space-y-2">
          {active.map((a) => {
            const clearAction = clearAlarm.bind(null, a.id, shipmentId);
            return (
              <li
                key={a.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-amber-800">
                    {fmtDateTime(a.status === "SNOOZED" ? a.snoozedUntil : a.triggerAt)}
                    {a.status === "SNOOZED" && <span className="ml-1 text-xs text-amber-600">(snoozed)</span>}
                  </p>
                  {a.label && <p className="text-xs text-amber-700">{a.label}</p>}
                </div>
                <form action={clearAction}>
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
                    title="Clear alarm"
                  >
                    <Trash2 size={13} />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <form action={setAction} className="space-y-2">
        <input
          type="datetime-local"
          name="triggerAt"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <input
          name="label"
          placeholder="Note (e.g. Call customer before loading)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          Set Alarm
        </button>
        <p className="text-[11px] text-slate-400">
          When it&apos;s due, a full-screen alert shows for every user until snoozed or closed.
        </p>
      </form>
    </div>
  );
}
