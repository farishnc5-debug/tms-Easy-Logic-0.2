"use client";

import { useState, useTransition } from "react";
import { KeyRound, Copy, Trash2, Check } from "lucide-react";
import { createApiKey, revokeApiKey } from "@/lib/actions/api-keys";
import { API_KEY_SCOPES } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";

export type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string;
  lastUsedAt: Date | string | null;
  revokedAt: Date | string | null;
  createdAt: Date | string;
  createdBy: { name: string } | null;
};

export default function ApiKeysManager({ keys }: { keys: ApiKeyRow[] }) {
  const [pending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function handleCreate(fd: FormData) {
    startTransition(async () => {
      const key = await createApiKey(fd);
      setNewKey(key);
      setShowForm(false);
    });
  }

  function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? Anything using it will stop working immediately.")) return;
    startTransition(() => revokeApiKey(id));
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const active = keys.filter((k) => !k.revokedAt);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
          <KeyRound size={14} /> API KEYS — FOR AGENT TMS & EXTERNAL ACCESS
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            + New Key
          </button>
        )}
      </div>

      {newKey && (
        <div className="mb-4 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3">
          <p className="mb-1.5 text-xs font-semibold text-emerald-800">
            Copy this key now — it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-emerald-200">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs font-medium text-emerald-700 underline"
          >
            Done
          </button>
        </div>
      )}

      {showForm && (
        <form action={handleCreate} className="mb-4 space-y-2.5 rounded-lg border border-slate-200 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Key name</label>
            <input
              name="name"
              required
              placeholder="e.g. Agent TMS — production"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Scopes</label>
            <div className="flex flex-wrap gap-2">
              {API_KEY_SCOPES.map((s) => (
                <label
                  key={s.code}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                >
                  <input type="checkbox" name="scopes" value={s.code} defaultChecked={s.code === "shipments:read"} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create Key"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {active.length === 0 ? (
        <p className="text-sm text-slate-400">No API keys yet.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{k.name}</p>
                <p className="truncate text-xs text-slate-400">
                  <code>{k.keyPrefix}</code> · {k.scopes.split(",").join(", ")}
                  {k.lastUsedAt ? ` · last used ${fmtDateTime(k.lastUsedAt)}` : " · never used"}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(k.id)}
                disabled={pending}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Revoke key"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
