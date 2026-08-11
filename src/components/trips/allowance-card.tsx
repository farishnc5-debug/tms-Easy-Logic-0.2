"use client";

import { useState, useTransition } from "react";
import { Banknote, CheckCircle2, Lock, Pencil, Paperclip, Send } from "lucide-react";
import { setTripAllowance, markAllowancePaid, sendTripMoney } from "@/lib/actions/trips";
import { useT } from "@/components/layout/locale-provider";

export default function AllowanceCard({
  tripId,
  driverAllowance,
  allowancePaid,
  allowancePaidAt,
  allowanceSlipUrl,
  allowanceSentBy,
  docsReceived,
  docsReceivedAt,
}: {
  tripId: string;
  driverAllowance: number | null;
  allowancePaid: boolean;
  allowancePaidAt: string | null;
  allowanceSlipUrl?: string | null;
  allowanceSentBy?: string | null;
  docsReceived: boolean;
  docsReceivedAt?: string | null;
}) {
  const [editing, setEditing] = useState(driverAllowance == null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <Banknote size={14} /> {t("DRIVER ALLOWANCE (TRIP MONEY)")}
      </p>

      {!editing && driverAllowance != null ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(driverAllowance)}{" "}
              <span className="text-sm font-medium text-slate-400">SAR</span>
            </p>
            {!allowancePaid && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Edit amount"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {/* Originals confirmation status — the gate the accountant checks */}
          <div
            className={`mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-xs ${
              docsReceived ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {docsReceived ? (
              <>
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                <span>
                  <b>Originals received in yard</b>
                  {docsReceivedAt && ` — ${new Date(docsReceivedAt).toLocaleString()}`}. Trip money
                  is released for transfer.
                </span>
              </>
            ) : (
              <>
                <Lock size={13} className="mt-0.5 shrink-0" />
                <span>
                  <b>LOCKED</b> — waiting for the yard to confirm receiving the original signed
                  delivery documents (confirm in Payment Follow-up).
                </span>
              </>
            )}
          </div>

          {allowancePaid ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircle2 size={13} /> SENT
                  {allowancePaidAt && (
                    <span className="font-normal">
                      · {new Date(allowancePaidAt).toLocaleString()}
                    </span>
                  )}
                </span>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => markAllowancePaid(tripId, false))}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline disabled:opacity-50"
                >
                  Undo
                </button>
              </div>
              {allowanceSentBy && (
                <p className="text-xs text-slate-500">Transferred by: {allowanceSentBy}</p>
              )}
              {allowanceSlipUrl ? (
                <a
                  href={allowanceSlipUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                >
                  <Paperclip size={12} /> View payment slip
                </a>
              ) : (
                <p className="text-xs text-slate-400">No payment slip attached.</p>
              )}
            </div>
          ) : (
            <form
              action={(fd) => startTransition(async () => { await sendTripMoney(fd); })}
              className="mt-3 space-y-2"
            >
              <input type="hidden" name="tripId" value={tripId} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Payment slip (optional — photo or PDF of the transfer)
                </span>
                <input
                  type="file"
                  name="slip"
                  accept="image/*,application/pdf"
                  disabled={!docsReceived}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-600 hover:file:bg-slate-200 disabled:opacity-50"
                />
              </label>
              <button
                type="submit"
                disabled={pending || !docsReceived}
                title={
                  !docsReceived
                    ? "Locked until the yard confirms the original documents are received"
                    : undefined
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={13} /> {t("Send Trip Money to Driver")}
              </button>
              <p className="text-[10px] leading-snug text-slate-400">
                Driver sends a photo of the Trip Money Receipt (waybill page 2) to accounts on
                WhatsApp 0592888119. Before 4 PM → transfer within 4 hours; after 4 PM → within 24
                hours.
              </p>
            </form>
          )}
        </>
      ) : (
        <form
          action={(fd) => {
            startTransition(async () => {
              await setTripAllowance(fd);
              setEditing(false);
            });
          }}
          className="space-y-2"
        >
          <input type="hidden" name="tripId" value={tripId} />
          <input
            type="number"
            name="driverAllowance"
            min={0}
            step="0.01"
            defaultValue={driverAllowance ?? ""}
            placeholder="Amount in SAR"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <p className="text-[10px] text-amber-600">
            Required before the waybill can be printed — page 2 of the waybill is the driver&apos;s
            trip money receipt.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {t("Save Amount")}
            </button>
            {driverAllowance != null && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
