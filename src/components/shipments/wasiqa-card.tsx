import { FileBadge } from "lucide-react";
import { updateWasiqa } from "@/lib/actions/shipments";
import { fmtDate } from "@/lib/format";

export default function WasiqaCard({
  shipmentId,
  wasiqaNumber,
  wasiqaStatus,
  wasiqaIssuedAt,
  wasiqaNotes,
}: {
  shipmentId: string;
  wasiqaNumber: string | null;
  wasiqaStatus: string | null;
  wasiqaIssuedAt: Date | null;
  wasiqaNotes: string | null;
}) {
  const action = updateWasiqa.bind(null, shipmentId);
  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400";
  const isoDate = wasiqaIssuedAt ? new Date(wasiqaIssuedAt).toISOString().slice(0, 10) : "";

  return (
    <div className="card p-5">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <FileBadge size={14} /> WASIQA (TGA TRANSPORT DOCUMENT)
      </p>
      <p className="mb-3 text-[11px] text-slate-400">
        Recorded manually from the TGA portal — not an automated integration.
      </p>
      <form action={action} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Wasiqa Number</label>
          <input name="wasiqaNumber" defaultValue={wasiqaNumber ?? ""} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select name="wasiqaStatus" defaultValue={wasiqaStatus ?? ""} className={input}>
              <option value="">Not issued</option>
              <option value="ISSUED">Issued</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Issued Date</label>
            <input type="date" name="wasiqaIssuedAt" defaultValue={isoDate} className={input} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
          <input name="wasiqaNotes" defaultValue={wasiqaNotes ?? ""} placeholder="e.g. reference / linked shipment on TGA portal" className={input} />
        </div>
        <button type="submit" className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900">
          Save Wasiqa Info
        </button>
        {wasiqaIssuedAt && (
          <p className="text-center text-[11px] text-slate-400">Last recorded: {fmtDate(wasiqaIssuedAt)}</p>
        )}
      </form>
    </div>
  );
}
