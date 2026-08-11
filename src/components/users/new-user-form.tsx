"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { createUser, type CreateUserState } from "@/lib/actions/users";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400";

export default function NewUserForm() {
  const [state, formAction, pending] = useActionState<CreateUserState, FormData>(createUser, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
        <input name="name" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input type="email" name="email" required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Temporary Password</label>
        <input type="password" name="password" required minLength={6} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select name="role" defaultValue="VIEWER" className={inputCls}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input name="title" placeholder="e.g. Dispatcher" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input name="phone" className={inputCls} />
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Link
          href="/users"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create User"}
        </button>
      </div>
    </form>
  );
}
