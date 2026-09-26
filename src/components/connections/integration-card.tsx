"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Send, Unplug, Pencil } from "lucide-react";

type Field = { name: string; label: string; type?: string; placeholder?: string; required?: boolean };

export type IntegrationRow = {
  status: string;
  lastTestAt: Date | string | null;
  lastTestOk: boolean | null;
  lastError: string | null;
  updatedAt: Date | string;
};

export default function IntegrationCard({
  icon,
  iconColor,
  title,
  description,
  fields,
  integration,
  saveAction,
  testAction,
  disconnectAction,
}: {
  // A rendered element (e.g. <Mail size={18} />), not a component reference —
  // component types can't cross the server→client boundary as props.
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  fields: Field[];
  integration: IntegrationRow;
  saveAction: (formData: FormData) => Promise<void>;
  testAction: () => Promise<{ ok: boolean; message: string }>;
  disconnectAction: () => Promise<void>;
}) {
  const connected = integration.status === "CONNECTED";
  // ERROR means a config exists but the last test failed — keep showing the
  // configured panel (with the error) rather than reverting to a blank form.
  const hasConfig = integration.status !== "DISCONNECTED";
  const [editing, setEditing] = useState(!hasConfig);
  const [pending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleTest() {
    setTestResult(null);
    startTransition(async () => {
      const res = await testAction();
      setTestResult(res);
    });
  }

  function handleSave(fd: FormData) {
    startTransition(async () => {
      await saveAction(fd);
      setEditing(false);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectAction();
      setEditing(true);
      setTestResult(null);
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}18` }}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        {connected ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} /> Connected
          </span>
        ) : hasConfig ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            <XCircle size={12} /> Connection error
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            Not connected
          </span>
        )}
      </div>

      {hasConfig && !editing ? (
        <div className="space-y-3">
          {integration.lastTestAt && (
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${
                integration.lastTestOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {integration.lastTestOk ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              Last test: {integration.lastTestOk ? "succeeded" : `failed — ${integration.lastError}`}
            </div>
          )}
          {testResult && (
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${
                testResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {testResult.message}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
            >
              <Send size={13} /> {pending ? "Sending…" : "Send test message"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={13} /> Reconfigure
            </button>
            <button
              onClick={handleDisconnect}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Unplug size={13} />
            </button>
          </div>
        </div>
      ) : (
        <form action={handleSave} className="space-y-2.5">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
              <input
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save & Connect"}
            </button>
            {hasConfig && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
