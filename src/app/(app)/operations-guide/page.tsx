import {
  Headset,
  Warehouse,
  Truck,
  Landmark,
  FileText,
  Banknote,
  ClipboardCheck,
  ArrowDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Who does what — the four roles of the operation
const ROLES = [
  {
    code: "CS",
    icon: Headset,
    color: "#2563eb",
    bg: "bg-brand-50",
    ring: "ring-brand-200",
    title: "Customer Service Representative",
    titleAr: "ممثل خدمة العملاء",
    duties: [
      "Receives new orders from customers and creates the booking",
      "Follows up with the driver: loading, in transit, arrival, delivery, empty return",
      "Updates the trip status in the system at every stage",
      "Keeps the customer informed throughout the trip",
    ],
    dutiesAr: [
      "يستقبل الطلبات الجديدة من العملاء وينشئ الحجز",
      "يتابع السائق: التحميل، الطريق، الوصول، التسليم، إرجاع الفارغ",
      "يحدّث حالة الرحلة في النظام في كل مرحلة",
      "يبقي العميل على اطلاع طوال الرحلة",
    ],
  },
  {
    code: "DS",
    icon: Warehouse,
    color: "#d97706",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    title: "Yard Dispatcher / Supervisor",
    titleAr: "منسق الساحة / المشرف",
    duties: [
      "Selects an available driver & truck and assigns them to the booking",
      "Sets the trip money amount (required before the waybill can print)",
      "Calls the driver to the yard and hands him the waybill + trip money receipt",
      "Marks the trip as Dispatched — only after the driver received the waybill",
      "Receives the ORIGINAL signed documents back from the driver after delivery",
      "Prepares the invoice, attaches the original documents, and sends to the customer",
    ],
    dutiesAr: [
      "يختار سائقاً وشاحنة متاحين ويسندهما إلى الحجز",
      "يحدد مبلغ عهدة الرحلة (إلزامي قبل طباعة البوليصة)",
      "يستدعي السائق إلى الساحة ويسلمه البوليصة وسند العهدة",
      "يحدّث الحالة إلى (تم الإرسال) — فقط بعد استلام السائق للبوليصة",
      "يستلم المستندات الأصلية الموقعة من السائق بعد التسليم",
      "يجهز الفاتورة ويرفق المستندات الأصلية ويرسلها للعميل",
    ],
  },
  {
    code: "DRIVER",
    icon: Truck,
    color: "#059669",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    title: "Driver",
    titleAr: "السائق",
    duties: [
      "Comes to the yard and receives the waybill + trip money receipt",
      "Loads, transports and delivers the shipment (and returns the empty container on round trips)",
      "Gets the customer's signature on the original delivery documents",
      "Hands the ORIGINAL signed documents to the yard supervisor",
      "Sends a photo of the trip money receipt to accounts on WhatsApp 0592888119",
    ],
    dutiesAr: [
      "يحضر إلى الساحة ويستلم البوليصة وسند عهدة الرحلة",
      "يحمّل وينقل ويسلّم الشحنة (ويعيد الحاوية الفارغة في الرحلات ذهاب وعودة)",
      "يحصل على توقيع العميل على مستندات التسليم الأصلية",
      "يسلّم المستندات الأصلية الموقعة لمشرف الساحة",
      "يرسل صورة سند العهدة إلى الحسابات واتساب 0592888119",
    ],
  },
  {
    code: "ACC",
    icon: Landmark,
    color: "#7c3aed",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    title: "Accounts Department",
    titleAr: "قسم الحسابات",
    duties: [
      "Confirms in the system that the yard received the original documents",
      "Transfers the driver's trip money: before 4 PM → within 4 hours, after 4 PM → within 24 hours",
      "Uploads the payment slip as proof of transfer",
      "Follows up the customer payment (cash: same day / credit: agreed days) and closes the shipment as PAID",
    ],
    dutiesAr: [
      "يتأكد في النظام أن الساحة استلمت المستندات الأصلية",
      "يحوّل عهدة السائق: قبل ٤ عصراً خلال ٤ ساعات، بعدها خلال ٢٤ ساعة",
      "يرفع إيصال التحويل كإثبات للدفع",
      "يتابع تحصيل العميل (نقدي: نفس اليوم / آجل: حسب الاتفاق) ويقفل الشحنة كمدفوعة",
    ],
  },
];

// The full lifecycle, step by step, with the responsible role
const STEPS: {
  n: number;
  role: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  screen?: string;
}[] = [
  {
    n: 1,
    role: "CS",
    title: "New booking received",
    titleAr: "استلام حجز جديد",
    desc: "CS receives the customer's order and creates the booking in Shipments — customer, route, cargo, one-way or round trip.",
    descAr: "يستقبل ممثل خدمة العملاء الطلب وينشئ الحجز في الشحنات — العميل، المسار، البضاعة، ذهاب فقط أو ذهاب وعودة.",
    screen: "Shipments → New Shipment",
  },
  {
    n: 2,
    role: "DS",
    title: "Driver assigned + trip money set",
    titleAr: "إسناد السائق وتحديد العهدة",
    desc: "DS picks an available driver & truck, assigns them to the booking and enters the trip money amount. The waybill will NOT print without it.",
    descAr: "يختار منسق الساحة سائقاً وشاحنة متاحين ويسند الحجز ويدخل مبلغ العهدة. لن تُطبع البوليصة بدونه.",
    screen: "Dispatching → Assign",
  },
  {
    n: 3,
    role: "DS",
    title: "Driver called to yard — waybill handed over",
    titleAr: "استدعاء السائق وتسليم البوليصة",
    desc: "DS calls the driver to the yard and hands him the printed waybill + trip money receipt (page 2). Only after the driver receives the waybill, DS marks the trip DISPATCHED.",
    descAr: "يستدعي المنسق السائق إلى الساحة ويسلمه البوليصة المطبوعة وسند العهدة (الصفحة الثانية). فقط بعد استلام السائق للبوليصة يحدّث المنسق الحالة إلى (تم الإرسال).",
    screen: "Shipment → Print Waybill → Advance to Dispatched",
  },
  {
    n: 4,
    role: "CS",
    title: "Loading confirmed (Collecting)",
    titleAr: "تأكيد التحميل",
    desc: "CS follows up with the driver and confirms he loaded the shipment, then updates the status to COLLECTING → IN TRANSIT.",
    descAr: "يتابع ممثل الخدمة السائق ويتأكد من تحميل الشحنة ثم يحدّث الحالة إلى (جاري التحميل) ثم (في الطريق).",
    screen: "Trips → Advance status",
  },
  {
    n: 5,
    role: "CS",
    title: "Arrival at delivery location",
    titleAr: "الوصول لموقع التسليم",
    desc: "When the driver reaches the delivery location, CS updates the status to AT DELIVERY.",
    descAr: "عند وصول السائق لموقع التسليم يحدّث ممثل الخدمة الحالة إلى (عند التسليم).",
    screen: "Trips → Advance status",
  },
  {
    n: 6,
    role: "CS",
    title: "Delivered — customer signs originals",
    titleAr: "تم التسليم — توقيع العميل على الأصول",
    desc: "Cargo delivered and the customer signs the original documents. CS updates the status to DELIVERED. For round trips, CS keeps updating: transit to empty return → at return area → offloaded.",
    descAr: "تُسلَّم البضاعة ويوقع العميل على المستندات الأصلية. يحدّث ممثل الخدمة الحالة إلى (تم التسليم). وفي رحلات العودة يتابع: في الطريق لإرجاع الفارغ → في منطقة الإرجاع → تم التفريغ.",
    screen: "Trips → Advance status",
  },
  {
    n: 7,
    role: "DRIVER",
    title: "Originals handed to yard",
    titleAr: "تسليم الأصول للساحة",
    desc: "Back at the yard, the driver hands the ORIGINAL signed documents to the yard supervisor (DS), who confirms receipt in the system. This unlocks the driver's trip money.",
    descAr: "عند عودته يسلّم السائق المستندات الأصلية الموقعة لمشرف الساحة الذي يؤكد الاستلام في النظام — وهذا يفك قفل عهدة السائق.",
    screen: "Payment Follow-up → Originals Received",
  },
  {
    n: 8,
    role: "ACC",
    title: "Trip money transferred to driver",
    titleAr: "تحويل العهدة للسائق",
    desc: "Driver WhatsApps a photo of his trip money receipt to accounts (0592888119). Accounts sees 'originals received ✓' in the system and transfers: before 4 PM → within 4 hours; after 4 PM → within 24 hours. Payment slip is uploaded as proof.",
    descAr: "يرسل السائق صورة سند العهدة للحسابات واتساب (0592888119). يرى المحاسب علامة (تم استلام الأصول ✓) فيحوّل: قبل ٤ عصراً خلال ٤ ساعات وبعدها خلال ٢٤ ساعة، ويرفع إيصال التحويل.",
    screen: "Trip → Send Trip Money",
  },
  {
    n: 9,
    role: "DS",
    title: "Invoice + originals sent to customer",
    titleAr: "إرسال الفاتورة مع الأصول للعميل",
    desc: "DS/accounts issues the tax invoice, ATTACHES the original documents to it, and sends the package to the customer.",
    descAr: "يصدر المنسق/الحسابات الفاتورة الضريبية ويرفق بها المستندات الأصلية وترسل للعميل.",
    screen: "Payment Follow-up → Issue Invoice",
  },
  {
    n: 10,
    role: "ACC",
    title: "Payment follow-up → shipment closed",
    titleAr: "متابعة التحصيل وإقفال الشحنة",
    desc: "Accounts follows the payment per the agreed terms (cash: due on receiving invoice+originals; credit: agreed days). When payment arrives, the shipment is closed as PAID.",
    descAr: "يتابع قسم الحسابات السداد حسب الاتفاق (نقدي: عند استلام الفاتورة والأصول، آجل: حسب المدة المتفق عليها). عند استلام الدفعة تُقفل الشحنة كمدفوعة.",
    screen: "Payment Follow-up → Mark Paid",
  },
];

function roleOf(code: string) {
  return ROLES.find((r) => r.code === code)!;
}

export default function OperationsGuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Intro */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={20} className="text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Operations Lifecycle — Who Does What
          </h2>
          <span dir="rtl" className="ms-auto text-lg font-bold text-slate-900">
            دورة العمليات — من يفعل ماذا
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          The complete operating procedure from a new booking to a closed, paid shipment — with
          the responsible person at every step.
          <span dir="rtl" className="mt-1 block">
            إجراءات العمل الكاملة من استلام الحجز حتى إقفال الشحنة مدفوعةً — مع المسؤول عن كل خطوة.
          </span>
        </p>
      </div>

      {/* Roles legend */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.code} className={`rounded-xl border border-slate-200 bg-white p-5 ring-2 ${r.ring}`}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${r.bg}`}
                  style={{ color: r.color }}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">
                    <span
                      className="me-2 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.code}
                    </span>
                    {r.title}
                  </p>
                  <p dir="rtl" className="text-sm font-semibold text-slate-600">
                    {r.titleAr}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                {r.duties.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="flex-1">
                      {d}
                      <span dir="rtl" className="mt-0.5 block text-slate-500">
                        {r.dutiesAr[i]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Visual flow map */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-5 text-xs font-semibold tracking-widest text-slate-400">
          THE FLOW — STEP BY STEP{" "}
          <span dir="rtl" className="float-right">
            سير العملية خطوة بخطوة
          </span>
        </p>
        <ol className="space-y-0">
          {STEPS.map((s, i) => {
            const role = roleOf(s.role);
            const Icon = role.icon;
            return (
              <li key={s.n}>
                <div className="flex gap-4">
                  {/* Step number + connector */}
                  <div className="flex flex-col items-center">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow"
                      style={{ backgroundColor: role.color }}
                    >
                      {s.n}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="my-1 flex flex-1 flex-col items-center">
                        <div className="w-0.5 flex-1 bg-slate-200" style={{ minHeight: 28 }} />
                        <ArrowDown size={14} className="-mt-1 text-slate-300" />
                      </div>
                    )}
                  </div>
                  {/* Card */}
                  <div className={`mb-4 flex-1 rounded-xl border border-slate-200 p-4 ${role.bg}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        <Icon size={11} /> {role.code}
                      </span>
                      <p className="font-bold text-slate-900">{s.title}</p>
                      <p dir="rtl" className="ms-auto font-bold text-slate-700">
                        {s.titleAr}
                      </p>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{s.desc}</p>
                    <p dir="rtl" className="mt-1 text-sm text-slate-600">
                      {s.descAr}
                    </p>
                    {s.screen && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                        <FileText size={11} /> In the system: {s.screen}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Golden rules */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
          <Banknote size={16} /> Golden rules — القواعد الذهبية
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-amber-800">
          <li>
            1. No waybill print without trip money entered. —{" "}
            <span dir="rtl">لا تُطبع البوليصة بدون إدخال مبلغ العهدة.</span>
          </li>
          <li>
            2. No dispatch update until the driver physically receives the waybill. —{" "}
            <span dir="rtl">لا يُحدَّث (تم الإرسال) حتى يستلم السائق البوليصة فعلياً.</span>
          </li>
          <li>
            3. No trip money transfer until the yard confirms the originals. —{" "}
            <span dir="rtl">لا تُحوَّل العهدة حتى تؤكد الساحة استلام الأصول.</span>
          </li>
          <li>
            4. No invoice without the original documents attached. —{" "}
            <span dir="rtl">لا فاتورة بدون إرفاق المستندات الأصلية.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
