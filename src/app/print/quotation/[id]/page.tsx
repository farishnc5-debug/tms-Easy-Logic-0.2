import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCompanyProfile } from "@/lib/company";
import CompanyHeader from "@/components/print/company-header";
import PrintToolbar from "@/components/print/print-toolbar";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const blank = sp.blank === "1";
  const [q, company] = await Promise.all([
    db.quotation.findUnique({ where: { id }, include: { customer: true } }),
    getCompanyProfile(),
  ]);
  if (!q) notFound();

  const vatAmount = (q.priceAmount * q.vatPct) / 100;
  const total = q.priceAmount + vatAmount;
  const isRound = q.tripType === "ROUND_TRIP";
  const custName = q.customer?.name ?? q.manualCustomerName;
  const custCompany = q.customer?.company ?? q.manualCustomerCompany;
  const custAddress = q.customer?.address ?? q.manualCustomerAddress;
  const custPhone = q.customer?.phone ?? q.manualCustomerPhone;
  const custEmail = q.customer?.email;

  return (
    <div>
      <PrintToolbar
        backHref={`/quotations/${q.id}`}
        secondaryToggleHref={`/print/quotation/${q.id}${blank ? "" : "?blank=1"}`}
        secondaryToggleActive={blank}
        secondaryToggleLabel="Print with Customer Section Blank"
        secondaryToggleActiveLabel="Blank customer section ✓"
      />

      <div className="print-page mx-auto my-6 max-w-[210mm] bg-white p-10 shadow-lg">
        <CompanyHeader company={company} docTitle="Transport Quotation" docTitleAr="عرض سعر نقل" />

        {/* Reference row */}
        <div className="mt-4 flex justify-between rounded border border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <span>
            <span className="text-slate-500">Quotation No:</span>{" "}
            <span className="font-bold text-slate-800">{q.code}</span>
          </span>
          <span>
            <span className="text-slate-500">Date:</span>{" "}
            <span className="font-medium text-slate-800">{fmtDate(q.createdAt)}</span>
          </span>
          <span>
            <span className="text-slate-500">Valid Until:</span>{" "}
            <span className="font-medium text-slate-800">{fmtDate(q.validUntil)}</span>
          </span>
        </div>

        {/* Customer block */}
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-slate-200 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              To / Customer
            </p>
            {blank ? (
              <>
                <p className="border-b border-slate-300 pb-1 text-slate-300">&nbsp;</p>
                <p className="mt-2 border-b border-slate-300 pb-1 text-slate-300">&nbsp;</p>
                <p className="mt-2 border-b border-slate-300 pb-1 text-slate-300">&nbsp;</p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-800">{custName ?? "—"}</p>
                {custCompany && <p className="text-slate-600">{custCompany}</p>}
                {custAddress && <p className="text-xs text-slate-500">{custAddress}</p>}
                {(custPhone || custEmail) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {custPhone}
                    {custEmail ? ` · ${custEmail}` : ""}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Subject
            </p>
            <p className="text-slate-700">
              Land transportation quotation for the route detailed below
              {isRound ? " (round trip — vehicle returns empty)" : " (one-way trip)"}.
            </p>
          </div>
        </div>

        {/* Service table */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0b1b3a] text-left text-white">
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">#</th>
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Service Description
              </th>
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Equipment
              </th>
              <th className="border border-[#0b1b3a] px-3 py-2 text-right text-xs font-semibold uppercase">
                Amount ({q.currency})
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-3 align-top text-slate-600">1</td>
              <td className="border border-slate-300 px-3 py-3 align-top">
                <p className="font-medium text-slate-800">
                  Transportation from <span className="font-bold">{q.originName}</span> to{" "}
                  <span className="font-bold">{q.destinationName}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Trip type: {isRound ? "Round trip — loading, delivery/unloading, empty return" : "One-way trip"}
                </p>
                {q.cargoDescription && (
                  <p className="mt-0.5 text-xs text-slate-500">Cargo: {q.cargoDescription}</p>
                )}
                {q.weightKg && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Approx. weight: {q.weightKg.toLocaleString()} kg
                  </p>
                )}
              </td>
              <td className="border border-slate-300 px-3 py-3 align-top text-slate-700">
                {q.vehicleType ?? "As required"}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right align-top font-medium text-slate-800">
                {q.priceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-3 ml-auto w-64 text-sm">
          <div className="flex justify-between border-b border-slate-200 py-1.5">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800">
              {q.priceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {q.currency}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-1.5">
            <span className="text-slate-500">VAT ({q.vatPct}%)</span>
            <span className="font-medium text-slate-800">
              {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {q.currency}
            </span>
          </div>
          <div className="flex justify-between bg-[#0b1b3a] px-2 py-2 font-bold text-white">
            <span>TOTAL</span>
            <span>
              {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {q.currency}
            </span>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6 text-xs leading-relaxed text-slate-600">
          <p className="mb-1 font-bold uppercase tracking-widest text-slate-500">Terms & Conditions</p>
          <ol className="list-decimal space-y-0.5 pl-4">
            <li>This quotation is valid until {fmtDate(q.validUntil)}.</li>
            <li>Prices are in {q.currency} and subject to {q.vatPct}% VAT as shown above.</li>
            <li>Payment terms: as agreed in the transport contract / service agreement.</li>
            <li>Cargo insurance is the responsibility of the shipper unless agreed otherwise in writing.</li>
            {isRound && <li>Round-trip price includes the empty return leg of the vehicle.</li>}
            {q.notes && <li>{q.notes}</li>}
          </ol>
        </div>

        {/* Bank details */}
        {(company.bankName || company.bankIban) && (
          <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-1 font-bold uppercase tracking-widest text-slate-500">Bank Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              {company.bankName && <p>Bank: {company.bankName}</p>}
              {company.bankBeneficiary && <p>Beneficiary: {company.bankBeneficiary}</p>}
              {company.bankIban && <p>IBAN: {company.bankIban}</p>}
              {company.bankAccount && <p>Account No: {company.bankAccount}</p>}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              For {company.name}
              <br />
              Authorized Signature & Stamp
            </p>
          </div>
          <div>
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Customer Acceptance
              <br />
              Name, Signature & Date
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
