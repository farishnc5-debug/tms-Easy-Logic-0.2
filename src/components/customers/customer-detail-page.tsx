import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Trash2, Route } from "lucide-react";
import { db } from "@/lib/db";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import CustomerFormFields from "@/components/customers/customer-form-fields";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

export default async function CustomerDetailPage({
  id,
  isVendor,
}: {
  id: string;
  isVendor: boolean;
}) {
  const base = isVendor ? "/vendors" : "/customers";
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      shipments: { orderBy: { createdAt: "desc" }, take: 10 },
      rates: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      _count: { select: { vendorRates: true } },
    },
  });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id, isVendor);
  const del = deleteCustomer.bind(null, id, isVendor);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href={base} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to {isVendor ? "Vendors" : "Customers"}
        </Link>
        <form action={del}>
          <ConfirmSubmitButton
            message={`Remove this ${isVendor ? "vendor" : "customer"}?`}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Remove
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="flex items-center gap-4 card p-6">
        <Avatar name={customer.name} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>
          {customer.nameAr && (
            <p className="text-sm text-slate-600" dir="rtl">
              {customer.nameAr}
            </p>
          )}
          <p className="text-sm text-slate-500">{customer.company}</p>
          {customer.contactPerson && (
            <p className="mt-0.5 text-xs text-slate-400">Contact: {customer.contactPerson}</p>
          )}
        </div>
        <div className="hidden text-right text-xs text-slate-500 sm:block">
          {customer.crNumber && <p>CR: {customer.crNumber}</p>}
          {customer.vatNumber && <p>VAT: {customer.vatNumber}</p>}
        </div>
      </div>

      {isVendor && (
        <Link
          href={`/tariff?vendorId=${id}`}
          className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 text-brand-800 hover:bg-brand-100"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Route size={16} /> View {customer.name}&apos;s Tariff Book
          </span>
          <span className="text-xs font-medium">
            {customer._count.vendorRates} lane{customer._count.vendorRates === 1 ? "" : "s"} →
          </span>
        </Link>
      )}

      {(customer.crDocDataUrl || customer.vatDocDataUrl) && (
        <div className="card p-6">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            LEGAL ATTACHMENTS
          </p>
          <div className="flex flex-wrap gap-3">
            {customer.crDocDataUrl && (
              <a
                href={customer.crDocDataUrl}
                download={customer.crDocName ?? "cr-certificate"}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText size={16} className="text-brand-600" />
                CR Certificate
                <span className="text-xs font-normal text-slate-400">{customer.crDocName}</span>
              </a>
            )}
            {customer.vatDocDataUrl && (
              <a
                href={customer.vatDocDataUrl}
                download={customer.vatDocName ?? "vat-certificate"}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText size={16} className="text-emerald-600" />
                VAT Certificate
                <span className="text-xs font-normal text-slate-400">{customer.vatDocName}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {customer.documents.length > 0 && (
        <div className="card p-6">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            {isVendor ? "VENDOR DOCUMENTS — REGISTRATION & QUOTATIONS" : "DOCUMENTS"}
          </p>
          <div className="flex flex-wrap gap-3">
            {customer.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.dataUrl}
                target="_blank"
                download={doc.name}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText size={16} className="text-violet-600" />
                {doc.name}
                <span className="text-xs font-normal text-slate-400">{fmtDate(doc.createdAt)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">
          EDIT {isVendor ? "VENDOR" : "CUSTOMER"}
        </p>
        <form action={action} className="space-y-5">
          <CustomerFormFields
            defaults={{
              name: customer.name,
              nameAr: customer.nameAr,
              company: customer.company,
              contactPerson: customer.contactPerson,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              streetName: customer.streetName,
              buildingNumber: customer.buildingNumber,
              district: customer.district,
              city: customer.city,
              postalCode: customer.postalCode,
              crNumber: customer.crNumber,
              vatNumber: customer.vatNumber,
              crDocName: customer.crDocName,
              vatDocName: customer.vatDocName,
              paymentTerms: customer.paymentTerms,
              creditDays: customer.creditDays,
              rates: customer.rates.map((r) => ({
                originName: r.originName,
                destinationName: r.destinationName,
                tripType: r.tripType,
                rateAmount: String(r.rateAmount),
              })),
            }}
            showRates={!isVendor}
          />
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {!isVendor && (
        <div className="card p-6">
          <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
            RECENT SHIPMENTS
          </p>
          {customer.shipments.length === 0 ? (
            <p className="text-sm text-slate-400">No shipments yet.</p>
          ) : (
            <ul className="space-y-2">
              {customer.shipments.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <Link href={`/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                    {s.code}
                  </Link>
                  <span className="text-slate-500">
                    {s.originName} → {s.destinationName}
                  </span>
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-slate-400">{fmtDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
