"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Send, FileMinus2, Loader2 } from "lucide-react";
import { sendInvoiceToZatca, issueZatcaCreditNote } from "@/lib/actions/zatca";

export type ZatcaDocRow = {
  id: string;
  docType: string;
  invoiceType: string;
  number: string;
  status: string;
  environment: string;
  createdAt: string;
  submittedAt: string | null;
  response: string | null;
};

const LABEL: Record<string, { text: string; cls: string }> = {
  CLEARED: { text: "Cleared by ZATCA", cls: "bg-emerald-50 text-emerald-700" },
  REPORTED: { text: "Reported to ZATCA", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { text: "Rejected by ZATCA", cls: "bg-red-50 text-red-700" },
  ERROR: { text: "Not delivered — will retry", cls: "bg-amber-50 text-amber-700" },
  PENDING: { text: "Sending…", cls: "bg-slate-100 text-slate-600" },
};

function errorsOf(response: string | null): string[] {
  if (!response) return [];
  try {
    const j = JSON.parse(response);
    const list = [...(j?.validationResults?.errorMessages ?? []), ...(j?.errors ?? [])];
    return list.map((e: { code?: string; message?: string }) => e.message ?? e.code ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

export default function ZatcaCard({
  invoiceId,
  connected,
  environment,
  documents,
  canSend,
}: {
  invoiceId: string;
  connected: boolean;
  environment: string | null;
  documents: ZatcaDocRow[];
  canSend: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showCredit, setShowCredit] = useState(false);

  const invoiceDoc = documents.find((d) => d.docType === "INVOICE" && (d.status === "CLEARED" || d.status === "REPORTED"));
  const latest = documents.find((d) => d.docType === "INVOICE");
  const credits = documents.filter((d) => d.docType === "CREDIT");

  function send() {
    setMsg(null);
    startTransition(async () => {
      const r = await sendInvoiceToZatca(invoiceId);
      setMsg({ ok: r.ok, text: r.message });
    });
  }

  function credit(fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await issueZatcaCreditNote(invoiceId, fd);
      setMsg({ ok: r.ok, text: r.ok ? "Credit note accepted by ZATCA." : r.message });
      if (r.ok) setShowCredit(false);
    });
  }

  return (
    <div className="card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <ShieldCheck size={14} /> ZATCA E-INVOICE
      </p>

      {!connected ? (
        <p className="text-sm text-slate-500">
          Not connected to ZATCA. The invoice prints with a basic QR code only. An administrator can
          connect Fatoora on the Connections page.
        </p>
      ) : (
        <div className="space-y-3">
          {environment && environment !== "PRODUCTION" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {environment} mode — test data only, not legally valid.
            </p>
          )}

          {latest ? (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${LABEL[latest.status]?.cls ?? "bg-slate-100"}`}>
              {latest.status === "REJECTED" ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
              {LABEL[latest.status]?.text ?? latest.status}
              <span className="ms-auto text-[11px] font-normal opacity-70">
                {latest.invoiceType === "STANDARD" ? "Tax invoice (B2B)" : "Simplified (B2C)"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not yet sent to ZATCA.</p>
          )}

          {latest?.status === "REJECTED" && (
            <ul className="list-disc space-y-1 ps-5 text-xs text-red-700">
              {errorsOf(latest.response).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          {!invoiceDoc && canSend && (
            <button
              onClick={send}
              disabled={pending}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {latest ? "Retry sending to ZATCA" : "Send to ZATCA"}
            </button>
          )}

          {invoiceDoc && canSend && (
            <>
              {credits.map((c) => (
                <p key={c.id} className="text-xs text-slate-500">
                  Credit note {c.number}: {LABEL[c.status]?.text ?? c.status}
                </p>
              ))}
              {!showCredit ? (
                <button
                  onClick={() => setShowCredit(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FileMinus2 size={13} /> Issue credit note (cancel this invoice)
                </button>
              ) : (
                <form action={credit} className="space-y-2 rounded-lg border border-red-100 bg-red-50/40 p-3">
                  <label className="block text-xs font-medium text-red-800">
                    Reason (required by ZATCA)
                  </label>
                  <input
                    name="reason"
                    required
                    placeholder="e.g. Wrong freight amount — invoice cancelled"
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                  />
                  <p className="text-[11px] text-red-700">
                    This reverses the whole invoice at ZATCA and cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {pending ? "Sending…" : "Issue credit note"}
                    </button>
                    <button type="button" onClick={() => setShowCredit(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {msg && (
            <p className={`rounded-lg px-3 py-2 text-xs ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
