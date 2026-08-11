import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { getCompanyProfile } from "@/lib/company";
import CompanyHeader from "@/components/print/company-header";
import PrintToolbar from "@/components/print/print-toolbar";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Accounts department contact for trip money transfers
const ACCOUNTS_PHONE = "0592888119";

function Cell({ label, value, labelAr }: { label: string; value?: string | null; labelAr?: string }) {
  return (
    <div className="border border-slate-300 px-2.5 py-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {labelAr && (
          <p dir="rtl" className="text-[9px] text-slate-400">
            {labelAr}
          </p>
        )}
      </div>
      <p className="min-h-[18px] text-sm font-medium text-slate-800">{value || " "}</p>
    </div>
  );
}

export default async function WaybillPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [shipment, company] = await Promise.all([
    db.shipment.findUnique({
      where: { id },
      include: {
        customer: true,
        trip: { include: { driver: true, vehicle: true } },
        stops: { orderBy: { seq: "asc" } },
      },
    }),
    getCompanyProfile(),
  ]);
  if (!shipment) notFound();

  const trip = shipment.trip;
  const waybillNo = shipment.code.replace(/^SHP/, "WB");
  const driverName = trip?.driver?.name ?? trip?.manualDriverName ?? null;
  const driverPhone = trip?.driver?.phone ?? trip?.manualDriverPhone ?? null;
  const vehiclePlate = trip?.vehicle?.plateNumber ?? trip?.manualVehicle ?? null;

  // GATE: the waybill (OBL) cannot be printed until the trip money amount is
  // set — this applies equally to registered and manually-entered drivers.
  const tripMoneyMissing = !trip || trip.driverAllowance == null || trip.driverAllowance <= 0;
  if (tripMoneyMissing) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-8 text-center shadow">
        <AlertTriangle size={40} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-lg font-bold text-amber-900">
          Waybill cannot be printed yet
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          {!trip
            ? "This booking has not been dispatched — assign a driver and set the trip money first."
            : "The Trip Money box is empty. Please fill in the driver's trip money amount before printing the waybill — the second page of the waybill is the driver's trip money receipt and it cannot be issued without an amount."}
        </p>
        <p dir="rtl" className="mt-2 text-sm text-amber-800">
          لا يمكن طباعة البوليصة: الرجاء إدخال مبلغ عهدة الرحلة (مصاريف السائق) أولاً.
        </p>
        <Link
          href={trip ? `/trips/${trip.id}` : `/shipments/${shipment.id}`}
          className="mt-5 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          {trip ? "Go to Trip — set Trip Money" : "Back to Booking"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PrintToolbar backHref={`/shipments/${shipment.id}`} />

      <div className="print-page mx-auto my-6 max-w-[210mm] bg-white p-10 shadow-lg">
        <CompanyHeader company={company} docTitle="Way Bill" docTitleAr="بوليصة شحن بري" />

        {/* Reference row */}
        <div className="mt-4 grid grid-cols-3 gap-0 text-xs">
          <div className="border border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Waybill No:</span>{" "}
            <span className="font-bold text-slate-900">{waybillNo}</span>
          </div>
          <div className="border border-l-0 border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Booking Ref:</span>{" "}
            <span className="font-medium text-slate-800">{shipment.code}</span>
          </div>
          <div className="border border-l-0 border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Issue Date:</span>{" "}
            <span className="font-medium text-slate-800">{fmtDate(new Date())}</span>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-4 grid grid-cols-2 gap-0">
          <div className="border border-slate-300 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Shipper / Customer <span dir="rtl" className="float-right">المرسل</span>
            </p>
            <p className="font-bold text-slate-800">{shipment.customer.name}</p>
            {shipment.customer.company && (
              <p className="text-sm text-slate-600">{shipment.customer.company}</p>
            )}
            {shipment.customer.address && (
              <p className="text-xs text-slate-500">{shipment.customer.address}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {shipment.customer.phone}
              {shipment.customer.email ? ` · ${shipment.customer.email}` : ""}
            </p>
          </div>
          <div className="border border-l-0 border-slate-300 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Carrier <span dir="rtl" className="float-right">الناقل</span>
            </p>
            <p className="font-bold text-slate-800">{company.name}</p>
            {company.crNumber && <p className="text-xs text-slate-500">C.R. No: {company.crNumber}</p>}
            {company.vatNumber && <p className="text-xs text-slate-500">VAT No: {company.vatNumber}</p>}
            <p className="mt-1 text-xs text-slate-500">
              {company.phone}
              {company.email ? ` · ${company.email}` : ""}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="mt-4 grid grid-cols-2 gap-0">
          <Cell
            label="Place of Loading"
            labelAr="مكان التحميل"
            value={
              shipment.originAddress
                ? `${shipment.originName} — ${shipment.originAddress}`
                : shipment.originName
            }
          />
          <Cell
            label="Place of Delivery"
            labelAr="مكان التسليم"
            value={
              shipment.destinationAddress
                ? `${shipment.destinationName} — ${shipment.destinationAddress}`
                : shipment.destinationName
            }
          />
        </div>

        {/* Transport details — registered driver/truck, or manually entered ones */}
        <div className="mt-4 grid grid-cols-4 gap-0">
          <Cell
            label="Driver Name"
            labelAr="السائق"
            value={trip?.driver?.name ?? trip?.manualDriverName}
          />
          <Cell
            label="Driver Phone"
            labelAr="جوال السائق"
            value={trip?.driver?.phone ?? trip?.manualDriverPhone}
          />
          <Cell label="License No" value={trip?.driver?.licenseNumber} />
          <Cell
            label="Vehicle Plate"
            labelAr="اللوحة"
            value={trip?.vehicle?.plateNumber ?? trip?.manualVehicle}
          />
          <Cell label="Vehicle Type" value={trip?.vehicle?.vehicleType} />
          <Cell label="Trip Ref" value={trip?.code} />
          <Cell label="Departure" value={trip?.departureAt ? fmtDateTime(trip.departureAt) : ""} />
          <Cell label="ETA" value={trip?.etaAt ? fmtDateTime(trip.etaAt) : ""} />
        </div>

        {/* Equipment & temperature requirement */}
        {(shipment.vehicleTypes || shipment.tempMinC != null) && (
          <div className="mt-4 grid grid-cols-2 gap-0">
            <Cell
              label="Equipment Required"
              labelAr="المعدات المطلوبة"
              value={
                shipment.vehicleTypes
                  ? shipment.vehicleTypes
                      .split(",")
                      .map((c) => VEHICLE_TYPE_LABELS[c] ?? c)
                      .join(" + ")
                  : "-"
              }
            />
            <div className="border border-l-0 border-slate-300 px-2.5 py-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Required Temperature
                </p>
                <p dir="rtl" className="text-[9px] text-slate-400">
                  درجة الحرارة المطلوبة
                </p>
              </div>
              {shipment.tempMinC != null && shipment.tempMaxC != null ? (
                <p className="min-h-[18px] text-sm font-bold text-cyan-700">
                  {shipment.tempMinC} °C — {shipment.tempMaxC} °C
                  <span className="ms-2 text-[10px] font-medium text-red-600">
                    MAINTAIN THROUGHOUT TRANSIT
                  </span>
                </p>
              ) : (
                <p className="min-h-[18px] text-sm font-medium text-slate-800">
                  Ambient / not temperature controlled
                </p>
              )}
            </div>
          </div>
        )}

        {/* Multiple delivery points inside the destination city */}
        {shipment.stops.length > 0 && (
          <div className="mt-4 border border-slate-300">
            <p className="border-b border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Delivery Points ({shipment.stops.length + 1})
              <span dir="rtl" className="float-right font-normal">
                نقاط التسليم
              </span>
            </p>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-8 px-2.5 py-1.5 text-center font-bold text-slate-500">1</td>
                  <td className="px-2 py-1.5 font-medium text-slate-800">
                    {shipment.destinationName}
                    {shipment.destinationAddress ? ` — ${shipment.destinationAddress}` : ""}
                    <span className="ms-2 text-[10px] text-slate-400">(main destination)</span>
                  </td>
                  <td className="w-40 px-2 py-1.5 text-slate-500" />
                  <td className="w-28 px-2 py-1.5 text-[10px] text-slate-400">
                    Received: ______
                  </td>
                </tr>
                {shipment.stops.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-2.5 py-1.5 text-center font-bold text-slate-500">{i + 2}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-medium text-slate-800">{s.name}</span>
                      {s.address && <span className="text-slate-500"> — {s.address}</span>}
                      {s.notes && (
                        <span className="block text-[10px] text-slate-400">{s.notes}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {s.contactName}
                      {s.contactPhone && (
                        <span className="block text-[10px] text-slate-400">{s.contactPhone}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-400">Received: ______</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cargo */}
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0b1b3a] text-left text-white">
              <th className="border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Description of Goods <span dir="rtl" className="float-right font-normal">وصف البضاعة</span>
              </th>
              <th className="w-28 border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Weight (kg)
              </th>
              <th className="w-28 border border-[#0b1b3a] px-3 py-2 text-xs font-semibold uppercase">
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-4 align-top text-slate-700">
                {shipment.notes || "General cargo as per customer declaration"}
              </td>
              <td className="border border-slate-300 px-3 py-4 text-center align-top text-slate-700">
                {shipment.weightKg ? shipment.weightKg.toLocaleString() : "-"}
              </td>
              <td className="border border-slate-300 px-3 py-4 text-center align-top text-slate-700">
                {shipment.priority}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms */}
        <div className="mt-4 text-[10px] leading-relaxed text-slate-500">
          <p className="mb-0.5 font-bold uppercase tracking-widest">Conditions of Carriage</p>
          <p>
            1. The goods described above were received in apparent good order and condition unless
            otherwise noted. 2. This waybill covers road transportation only, from the place of
            loading to the place of delivery stated above. 3. The shipper certifies the accuracy of
            the cargo description and weight. 4. Any damage or shortage must be noted at the time of
            delivery and reported to the carrier within 24 hours. 5. Carriage is subject to the
            carrier's standard terms and applicable transport regulations of the Kingdom of Saudi
            Arabia.
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="h-16" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Shipper Signature
              <br />
              <span dir="rtl">توقيع المرسل</span>
            </p>
          </div>
          <div>
            <div className="h-16" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Driver Signature
              <br />
              <span dir="rtl">توقيع السائق</span>
            </p>
          </div>
          <div>
            <div className="h-16" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Receiver Signature & Stamp
              <br />
              <span dir="rtl">توقيع المستلم والختم</span>
            </p>
          </div>
        </div>
      </div>

      {/* ============ PAGE 2 — TRIP MONEY RECEIPT (driver's copy) ============ */}
      <div className="print-page mx-auto my-6 max-w-[210mm] break-before-page bg-white p-10 shadow-lg">
        <CompanyHeader company={company} docTitle="Trip Money Receipt" docTitleAr="سند عهدة الرحلة" />

        <div className="mt-4 grid grid-cols-3 gap-0 text-xs">
          <div className="border border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Receipt No:</span>{" "}
            <span className="font-bold text-slate-900">{shipment.code.replace(/^SHP/, "TM")}</span>
          </div>
          <div className="border border-l-0 border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Waybill No:</span>{" "}
            <span className="font-medium text-slate-800">{waybillNo}</span>
          </div>
          <div className="border border-l-0 border-slate-300 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Issue Date:</span>{" "}
            <span className="font-medium text-slate-800">{fmtDate(new Date())}</span>
          </div>
        </div>

        {/* Driver & vehicle */}
        <p className="mt-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Driver & Vehicle <span dir="rtl" className="float-right">السائق والمركبة</span>
        </p>
        <div className="grid grid-cols-4 gap-0">
          <Cell label="Driver Name" labelAr="السائق" value={driverName} />
          <Cell label="Driver Phone" labelAr="الجوال" value={driverPhone} />
          <Cell label="License No" labelAr="الرخصة" value={trip?.driver?.licenseNumber} />
          <Cell label="Vehicle Plate" labelAr="اللوحة" value={vehiclePlate} />
        </div>

        {/* Full shipment info */}
        <p className="mt-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Shipment Details <span dir="rtl" className="float-right">تفاصيل الشحنة</span>
        </p>
        <div className="grid grid-cols-3 gap-0">
          <Cell label="Booking Ref" value={shipment.code} />
          <Cell label="Trip Ref" value={trip?.code} />
          <Cell label="Customer" labelAr="العميل" value={shipment.customer.name} />
          <Cell label="From (Loading)" labelAr="من" value={shipment.originName} />
          <Cell label="To (Delivery)" labelAr="إلى" value={shipment.destinationName} />
          <Cell
            label={shipment.tripType === "ROUND_TRIP" ? "Empty Return To" : "Trip Type"}
            labelAr={shipment.tripType === "ROUND_TRIP" ? "إرجاع الفارغ إلى" : "نوع الرحلة"}
            value={shipment.tripType === "ROUND_TRIP" ? shipment.returnName : "One Way"}
          />
          <Cell
            label="Cargo"
            labelAr="البضاعة"
            value={shipment.notes || "General cargo"}
          />
          <Cell
            label="Weight (kg)"
            labelAr="الوزن"
            value={shipment.weightKg ? shipment.weightKg.toLocaleString() : "-"}
          />
          <Cell
            label="Departure"
            labelAr="المغادرة"
            value={trip?.departureAt ? fmtDateTime(trip.departureAt) : "-"}
          />
        </div>

        {/* Amount */}
        <div className="mt-5 flex items-stretch gap-0">
          <div className="flex-1 border-2 border-[#0b1b3a] bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Trip Money Amount <span dir="rtl" className="float-right">مبلغ عهدة الرحلة</span>
            </p>
            <p className="mt-1 text-3xl font-extrabold text-[#0b1b3a]">
              SAR {trip!.driverAllowance!.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-64 border-2 border-l-0 border-[#0b1b3a] p-4 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Accounts Department</p>
            <p dir="rtl" className="font-bold text-slate-800">قسم الحسابات</p>
            <p className="mt-1 text-lg font-extrabold tracking-wide text-[#0b1b3a]">
              {ACCOUNTS_PHONE}
            </p>
            <p>WhatsApp / Phone Call — واتساب / اتصال</p>
          </div>
        </div>

        {/* Payment procedure */}
        <div className="mt-5 border border-slate-300 p-4 text-xs leading-relaxed text-slate-700">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Trip Money Payment Procedure
            <span dir="rtl" className="float-right">إجراءات صرف عهدة الرحلة</span>
          </p>
          <ol className="list-decimal space-y-1 ps-5">
            <li>
              Deliver the cargo and obtain the customer&apos;s signature on the original delivery
              documents. <span dir="rtl">قم بتسليم البضاعة واحصل على توقيع العميل على المستندات الأصلية.</span>
            </li>
            <li>
              Hand over the ORIGINAL signed documents to the yard supervisor / dispatcher.{" "}
              <span dir="rtl">سلّم المستندات الأصلية الموقعة لمشرف الساحة.</span>
            </li>
            <li>
              After handing over the originals, send a photo of THIS document to the accounts
              department on WhatsApp: <b>{ACCOUNTS_PHONE}</b>.{" "}
              <span dir="rtl">بعد تسليم الأصول، أرسل صورة هذا المستند إلى قسم الحسابات عبر الواتساب.</span>
            </li>
            <li>
              Photo sent <b>before 4:00 PM</b> → the trip money is transferred{" "}
              <b>within 4 hours</b>. Sent <b>after 4:00 PM</b> → transferred{" "}
              <b>within 24 hours</b>.{" "}
              <span dir="rtl">
                قبل الساعة ٤ عصراً: يتم التحويل خلال ٤ ساعات — بعد الساعة ٤: خلال ٢٤ ساعة.
              </span>
            </li>
            <li>
              All communication is via WhatsApp or phone call with the accounts department.{" "}
              <span dir="rtl">التواصل عبر الواتساب أو الاتصال الهاتفي مع قسم الحسابات.</span>
            </li>
          </ol>
          <p className="mt-2 font-semibold text-red-600">
            The trip money is released ONLY after the yard confirms receiving the original signed
            documents. <span dir="rtl">لا يتم صرف العهدة إلا بعد تأكيد استلام المستندات الأصلية.</span>
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="h-14" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Driver Signature
              <br />
              <span dir="rtl">توقيع السائق</span>
            </p>
          </div>
          <div>
            <div className="h-14" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Yard Supervisor — Originals Received (Date & Time)
              <br />
              <span dir="rtl">مشرف الساحة — استلام الأصول (التاريخ والوقت)</span>
            </p>
          </div>
          <div>
            <div className="h-14" />
            <p className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
              Accounts — Transfer Ref
              <br />
              <span dir="rtl">الحسابات — مرجع التحويل</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
