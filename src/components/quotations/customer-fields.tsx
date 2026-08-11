"use client";

import { useState } from "react";

export default function QuotationCustomerFields({
  customers,
}: {
  customers: { id: string; name: string; company: string | null }[];
}) {
  const [manual, setManual] = useState(false);
  const input =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="sm:col-span-2 space-y-3">
      <input type="hidden" name="manualMode" value={manual ? "1" : ""} />

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
        <span>
          <span className="font-medium">No saved customer — type details manually</span>
          <span className="block text-xs text-slate-500">
            Use this when quoting a walk-in / new customer who isn&apos;t in the system yet.
          </span>
        </span>
      </label>

      {!manual ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
          <select name="customerId" defaultValue="" className={input}>
            <option value="" disabled>
              Select customer
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
            <input name="manualCustomerName" required placeholder="e.g. Ahmed Al-Otaibi" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company (optional)</label>
            <input name="manualCustomerCompany" placeholder="e.g. Otaibi Trading Est." className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
            <input name="manualCustomerPhone" placeholder="e.g. 05xxxxxxxx" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address (optional)</label>
            <input name="manualCustomerAddress" placeholder="e.g. Jeddah" className={input} />
          </div>
        </div>
      )}
    </div>
  );
}
