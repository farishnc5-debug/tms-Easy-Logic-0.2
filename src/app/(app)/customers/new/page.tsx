import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCustomer } from "@/lib/actions/customers";
import CustomerFormFields from "@/components/customers/customer-form-fields";

export default function NewCustomerPage() {
  const action = createCustomer.bind(null, false);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/customers" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Customers
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Add Customer</h2>
        <p className="mb-5 text-sm text-slate-500">Register a new customer.</p>
        <form action={action} className="space-y-5">
          <CustomerFormFields />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link href="/customers" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
