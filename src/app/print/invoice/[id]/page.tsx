import { notFound } from "next/navigation";
import { totalsOf } from "@/lib/money";
import { db } from "@/lib/db";
import { getCompanyProfile } from "@/lib/company";
import CompanyHeader from "@/components/print/company-header";
import PrintToolbar from "@/components/print/print-toolbar";
import { fmtDate } from "@/lib/format";
import QRCode from "qrcode";
import { buildQr } from "@/lib/zatca/qr";
import { riyadhParts } from "@/lib/zatca/service";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const withAttachments = sp.attachments === "1";
  const [invoice, company] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        charges: true,
        zatcaDocuments: {
          where: { docType: "INVOICE" },
          orderBy: { createdAt: "desc" },
          select: { status: true, invoiceType: true, qr: true, uuid: true, icv: true, environment: true },
        },
        settlement: {
          include: {
            shipment: {
              include: {
                customer: true,
                trip: { include: { documents: true } },
                documents: true,
                pod: true,
              },
            },
          },
        },
      },
    }),
    getCompanyProfile(),
  ]);
  if (!invoice) notFound();

  const shipment = invoice.settlement.shipment;
  const customer = shipment.customer;
  const trip = shipment.trip;
  const { subtotal, vat: vatAmount, total } = totalsOf(
    invoice.amount,
    invoice.vatPct,
    invoice.charges.map((c) => c.amount),
  );
  const isCredit = invoice.settlement.paymentTerms === "CREDIT";

  // ZATCA e-invoice: prefer the accepted document's QR (it carries the cryptographic
  // stamp). Without one, print a basic (Phase 1) QR so the invoice is still scannable.
  const zDoc = invoice.zatcaDocuments.find((d) => d.status === "CLEARED" || d.status === "REPORTED");
  const zLatest = invoice.zatcaDocuments[0];
  const simplified = zDoc ? zDoc.invoiceType === "SIMPLIFIED" : !customer.vatNumber;
  let qrPayload: string | null = zDoc?.qr ?? null;
  if (!qrPayload && company.vatNumber) {
    const at = riyadhParts(invoice.issuedAt);
    qrPayload = buildQr({
      sellerName: company.name,
      vatNumber: company.vatNumber,
      timestamp: `${at.date}T${at.time}`,
      totalWithVat: total.toFixed(2),
      vatTotal: vatAmount.toFixed(2),
    });
  }
  const qrImage = qrPayload
    ? await QRCode.toDataURL(qrPayload, { margin: 1, width: 220, errorCorrectionLevel: "M" })
    : null;

  // Everything attached to this shipment, printable together with the invoice
  const isImage = (u: string | null | undefined) =>
    !!u && (/\.(jpg|jpeg|png|webp|gif)$/i.test(u) || u.startsWith("data:image"));
  const allDocs = [
    ...(shipment.pod?.photoDataUrl
      ? [{ name: `Proof of Delivery — received by ${shipment.pod.receivedBy}`, url: shipment.pod.photoDataUrl }]
      : []),
    ...shipment.documents.map((d) => ({ name: d.name, url: d.dataUrl })),
    ...(trip?.documents ?? []).map((d) => ({ name: d.name, url: d.dataUrl })),
  ];
  const imageDocs = allDocs.filter((d) => isImage(d.url));
  const fileDocs = allDocs.filter((d) => !isImage(d.url));

  return (
    <div>
      <PrintToolbar
        backHref={`/settlements/${shipment.id}`}
        attachmentsHref={withAttachments ? `/print/invoice/${id}` : `/print/invoice/${id}?attachments=1`}
        attachmentsActive={withAttachments}
        attachmentsCount={allDocs.length}
      />

      <div className="print-page mx-auto my-6 max-w-[210mm] bg-white p-10 shadow-lg">
        <CompanyHeader company={company} docTitle={simplified ? "Simplified Tax Invoice" : "Tax Invoice"} docTitleAr={simplified ? "فاتورة ضريبية مبسطة" : "فاتورة ضريبية"} />

        {/* Reference row */}
        <div className="mt-4 flex justify-between rounded border border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <span>
            <span className="text-slate-500">Invoice No:</span>{" "}
            <span className="font-bold text-slate-800">{invoice.code}</span>
          </span>
          <span>
            <span className="text-slate-500">Issue Date:</span>{" "}
            <span className="font-medium text-slate-800">{fmtDate(invoice.issuedAt)}</span>
          </span>
          <span>
            <span className="text-slate-500">Due Date:</span>{" "}
            <span className="font-bold text-slate-800">{fmtDate(invoice.dueAt)}</span>
          </span>
          <span>
            <span className="text-slate-500">Terms:</span>{" "}
            <span className="font-medium text-slate-800">
              {isCredit
                ? `Credit ${invoice.settlement.creditDays ?? ""} days`
                : "Cash — due on receipt"}
            </span>
          </span>
        </div>

        {/* Bill-to + shipment reference */}
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-slate-200 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Bill To / العميل
            </p>
            <p className="font-bold text-slate-800">{customer.name}</p>
            {customer.nameAr && (
              <p className="text-slate-700" dir="rtl">
                {customer.nameAr}
              </p>
            )}
            {customer.company && <p className="text-slate-600">{customer.company}</p>}
            {customer.contactPerson && (
              <p className="text-xs text-slate-500">Attn: {customer.contactPerson}</p>
            )}
            {customer.address && <p className="text-xs text-slate-500">{customer.address}</p>}
            <p className="mt-1 text-xs text-slate-500">
              {customer.phone}
              {customer.email ? ` · ${customer.email}` : ""}
            </p>
            <div className="mt-1 text-xs text-slate-500">
              {customer.crNumber && <span className="mr-3">CR: {customer.crNumber}</span>}
              {customer.vatNumber && <span>VAT: {customer.vatNumber}</span>}
            </div>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Shipment Reference
            </p>
            <div className="space-y-0.5 text-xs text-slate-600">
              <p>
                Waybill / Shipment: <span className="font-bold text-slate-800">{shipment.code}</span>
              </p>
              {trip && (
                <p>
                  Trip: <span className="font-medium">{trip.code}</span>
                </p>
              )}
              <p>
                Route:{" "}
                <span className="font-medium">
                  {shipment.originName} → {shipment.destinationName}
                </span>
              </p>
              {trip?.deliveredAt && <p>Delivered: {fmtDate(trip.deliveredAt)}</p>}
              <p className="pt-1 text-slate-500">
                Original signed delivery documents enclosed with this invoice.
              </p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0b1b3a] text-left text-white">
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">#</th>
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Description
              </th>
              <th className="border border-[#0b1b3a] px-3 py-2 text-right text-xs font-semibold uppercase">
                Amount ({invoice.currency})
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-3 align-top text-slate-600">1</td>
              <td className="border border-slate-300 px-3 py-3 align-top">
                <p className="font-medium text-slate-800">
                  Land transportation services — {shipment.originName} to{" "}
                  {shipment.destinationName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Shipment {shipment.code}
                  {shipment.weightKg ? ` · approx. ${shipment.weightKg.toLocaleString()} kg` : ""}
                </p>
                {invoice.notes && <p className="mt-0.5 text-xs text-slate-500">{invoice.notes}</p>}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right align-top font-medium text-slate-800">
                {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
            {/* Additional charges (waiting time, detention, ...) */}
            {invoice.charges.map((c, i) => (
              <tr key={c.id}>
                <td className="border border-slate-300 px-3 py-2.5 align-top text-slate-600">
                  {i + 2}
                </td>
                <td className="border border-slate-300 px-3 py-2.5 align-top">
                  <p className="font-medium text-slate-800">{c.description}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Additional charge — رسوم إضافية
                  </p>
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right align-top font-medium text-slate-800">
                  {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-3 ml-auto w-64 text-sm">
          <div className="flex justify-between border-b border-slate-200 py-1.5">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800">
              {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              {invoice.currency}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200 py-1.5">
            <span className="text-slate-500">VAT ({invoice.vatPct}%)</span>
            <span className="font-medium text-slate-800">
              {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoice.currency}
            </span>
          </div>
          <div className="flex justify-between bg-[#0b1b3a] px-2 py-2 font-bold text-white">
            <span>TOTAL DUE</span>
            <span>
              {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {invoice.currency}
            </span>
          </div>
        </div>

        {/* Payment terms */}
        <div className="mt-6 text-xs leading-relaxed text-slate-600">
          <p className="mb-1 font-bold uppercase tracking-widest text-slate-500">Payment Terms</p>
          <ol className="list-decimal space-y-0.5 pl-4">
            {isCredit ? (
              <li>
                Payment is due within {invoice.settlement.creditDays ?? "the agreed"} days of
                receiving this invoice and the original delivery documents — due{" "}
                {fmtDate(invoice.dueAt)}.
              </li>
            ) : (
              <li>
                Cash terms: payment is due upon receipt of this invoice together with the original
                signed delivery documents (same day).
              </li>
            )}
            <li>Please quote invoice number {invoice.code} with your payment.</li>
            <li>Amounts are in {invoice.currency}, inclusive of {invoice.vatPct}% VAT as itemised.</li>
          </ol>
        </div>

        {/* Bank details */}
        {(company.bankName || company.bankIban) && (
          <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-1 font-bold uppercase tracking-widest text-slate-500">
              Bank Details for Payment
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              {company.bankName && <p>Bank: {company.bankName}</p>}
              {company.bankBeneficiary && <p>Beneficiary: {company.bankBeneficiary}</p>}
              {company.bankIban && <p>IBAN: {company.bankIban}</p>}
              {company.bankAccount && <p>Account No: {company.bankAccount}</p>}
            </div>
          </div>
        )}

        {qrImage && (
          <div className="mt-5 flex items-center gap-4 rounded border border-slate-200 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="ZATCA QR code" width={110} height={110} />
            <div className="text-[11px] leading-relaxed text-slate-500">
              <p className="font-semibold text-slate-700">
                {zDoc
                  ? zDoc.status === "CLEARED"
                    ? "Cleared by ZATCA (Fatoora) / تم اعتمادها من هيئة الزكاة والضريبة والجمارك"
                    : "Reported to ZATCA (Fatoora) / تم الإبلاغ عنها لهيئة الزكاة والضريبة والجمارك"
                  : "E-invoice QR code / رمز الاستجابة السريعة للفاتورة الإلكترونية"}
              </p>
              {zDoc ? (
                <>
                  <p>Invoice UUID: {zDoc.uuid}</p>
                  <p>Counter (ICV): {zDoc.icv}</p>
                  {zDoc.environment !== "PRODUCTION" && (
                    <p className="font-semibold text-amber-600">
                      {zDoc.environment} TEST DOCUMENT — NOT LEGALLY VALID
                    </p>
                  )}
                </>
              ) : (
                <p>
                  {zLatest?.status === "REJECTED"
                    ? "ZATCA rejected this invoice — see the invoice page for the reasons."
                    : "Not yet submitted to ZATCA. This QR holds the basic invoice data only."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              For {company.name}
              <br />
              Accounts Department — Signature & Stamp
            </p>
          </div>
          <div>
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Received by Customer
              <br />
              Name, Signature & Date
            </p>
          </div>
        </div>
      </div>

      {/* ====== ATTACHMENTS — appended pages when ?attachments=1 ====== */}
      {withAttachments && allDocs.length > 0 && (
        <>
          {/* Attachment manifest page */}
          <div className="print-page mx-auto my-6 max-w-[210mm] break-before-page bg-white p-10 shadow-lg">
            <CompanyHeader
              company={company}
              docTitle="Invoice Attachments"
              docTitleAr="مرفقات الفاتورة"
            />
            <p className="mt-4 text-sm text-slate-600">
              The following {allDocs.length} document{allDocs.length === 1 ? "" : "s"} are enclosed
              with invoice <b>{invoice.code}</b> for shipment <b>{shipment.code}</b>:
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 ps-6 text-sm text-slate-700">
              {allDocs.map((d, i) => (
                <li key={i}>
                  {d.name}
                  {!isImage(d.url) && (
                    <span className="ms-2 text-xs text-slate-400">
                      (file — printed/attached separately if not an image)
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {fileDocs.length > 0 && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Note: {fileDocs.length} non-image file(s) (e.g. PDFs) cannot be embedded into this
                printout — open them from the shipment&apos;s Documents section and print them
                separately, or attach the digital files when emailing this invoice.
              </p>
            )}
          </div>

          {/* One page per image attachment */}
          {imageDocs.map((d, i) => (
            <div
              key={i}
              className="print-page mx-auto my-6 max-w-[210mm] break-before-page bg-white p-10 shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between border-b-2 border-[#0b1b3a] pb-2 text-xs text-slate-600">
                <span className="font-bold uppercase tracking-widest">
                  Attachment {i + 1} of {imageDocs.length} — {d.name}
                </span>
                <span>
                  Invoice {invoice.code} · Shipment {shipment.code}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.url}
                alt={d.name}
                className="mx-auto max-h-[240mm] w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
