"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Loader2, Unplug } from "lucide-react";
import { zatcaOnboard, zatcaDisconnect, type OnboardResult } from "@/lib/actions/zatca";

const ENV_HELP: Record<string, string> = {
  SANDBOX: "ZATCA's free test system. Nothing is legally submitted. The public test OTP is 123345.",
  SIMULATION: "ZATCA's pre-production rehearsal. Needs a real OTP from your Fatoora portal account.",
  PRODUCTION: "LIVE and legally binding. Needs a real OTP from your Fatoora portal account.",
};

export default function ZatcaConnectCard({
  onboarded,
  environment,
  onboardedAt,
}: {
  onboarded: boolean;
  environment: string | null;
  onboardedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [env, setEnv] = useState("SANDBOX");
  const [result, setResult] = useState<OnboardResult | null>(null);

  function run(fd: FormData) {
    setResult(null);
    startTransition(async () => setResult(await zatcaOnboard(fd)));
  }

  return (
    <div className="card p-5 sm:col-span-2">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <ShieldCheck size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">ZATCA E-Invoicing (Fatoora)</p>
            <p className="text-xs text-slate-500">
              Sign every invoice and send it to ZATCA — clearance for tax invoices, reporting for simplified ones.
            </p>
          </div>
        </div>
        {onboarded ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} /> Connected · {environment}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            Not connected
          </span>
        )}
      </div>

      {onboarded ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Connected in <strong>{environment}</strong> mode
            {onboardedAt ? ` on ${new Date(onboardedAt).toLocaleDateString()}` : ""}. New invoices are sent to ZATCA
            automatically when issued.
          </p>
          {environment !== "PRODUCTION" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This is a test connection: invoices sent now have no legal effect. Reconnect in PRODUCTION mode before
              you go live.
            </p>
          )}
          <button
            onClick={() => {
              if (confirm("Disconnect from ZATCA? You will need a new OTP to reconnect.")) startTransition(() => zatcaDisconnect());
            }}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Unplug size={13} /> Disconnect / switch environment
          </button>
        </div>
      ) : (
        <form action={run} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-slate-600 sm:col-span-1">
              Environment
              <select
                name="environment"
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                <option value="SANDBOX">Sandbox (test)</option>
                <option value="SIMULATION">Simulation (rehearsal)</option>
                <option value="PRODUCTION">Production (live)</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              One-time password (OTP, 6 digits)
              <input
                name="otp"
                required
                inputMode="numeric"
                maxLength={6}
                placeholder={env === "SANDBOX" ? "123345" : "From the Fatoora portal"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </label>
          </div>
          <p className={`rounded-lg px-3 py-2 text-xs ${env === "PRODUCTION" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}>
            {ENV_HELP[env]} Uses the VAT number, CR number and National Address from your Company Profile.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {pending ? "Onboarding — running ZATCA compliance tests…" : "Connect to ZATCA"}
          </button>
        </form>
      )}

      {result && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 p-3 text-xs">
          {result.steps.map((s, i) => (
            <p key={i} className={`flex items-start gap-1.5 ${s.ok ? "text-emerald-700" : "text-red-700"}`}>
              {s.ok ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <XCircle size={13} className="mt-0.5 shrink-0" />}
              <span>
                {s.step}
                {s.detail ? ` — ${s.detail}` : ""}
              </span>
            </p>
          ))}
          {result.error && <p className="font-medium text-red-700">{result.error}</p>}
          {result.ok && <p className="font-medium text-emerald-700">Connected. You can now send invoices to ZATCA.</p>}
        </div>
      )}
    </div>
  );
}
