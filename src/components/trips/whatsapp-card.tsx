"use client";

import { useState, useTransition } from "react";
import { MessageCircle, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { sendTripWhatsAppMessage } from "@/lib/actions/messaging";
import { fmtDateTime } from "@/lib/format";

export type WhatsAppMessageRow = {
  id: string;
  direction: string;
  toPhone: string | null;
  fromPhone: string | null;
  body: string;
  status: string;
  createdAt: string;
};

export default function WhatsAppCard({
  tripId,
  hasDriverPhone,
  hasCustomerPhone,
  messages,
}: {
  tripId: string;
  hasDriverPhone: boolean;
  hasCustomerPhone: boolean;
  messages: WhatsAppMessageRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSend(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await sendTripWhatsAppMessage(tripId, fd);
      setResult(res);
    });
  }

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <MessageCircle size={14} className="text-emerald-600" /> WHATSAPP
      </p>

      <form action={handleSend} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Send to</label>
          <select
            name="recipient"
            defaultValue={hasDriverPhone ? "driver" : "customer"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            <option value="driver" disabled={!hasDriverPhone}>
              Driver{!hasDriverPhone ? " (no phone on file)" : ""}
            </option>
            <option value="customer" disabled={!hasCustomerPhone}>
              Customer{!hasCustomerPhone ? " (no phone on file)" : ""}
            </option>
          </select>
        </div>
        <textarea
          name="message"
          required
          rows={3}
          placeholder="e.g. Your driver is on the way. ETA in 2 hours."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input type="checkbox" name="includeLocation" value="1" defaultChecked />
          <MapPin size={13} className="text-slate-400" /> Include live GPS location link
        </label>
        {result && (
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${
              result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {result.message}
          </div>
        )}
        <button
          type="submit"
          disabled={pending || (!hasDriverPhone && !hasCustomerPhone)}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send WhatsApp Message"}
        </button>
      </form>

      {messages.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-2.5 text-xs ${
                m.direction === "IN" ? "bg-slate-50 text-slate-700" : "bg-emerald-50/60 text-emerald-900"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {m.direction === "IN" ? `From ${m.fromPhone}` : `To ${m.toPhone}`}
                  {m.status === "FAILED" && <span className="ml-1 font-semibold text-red-500">FAILED</span>}
                </span>
                <span>{fmtDateTime(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
