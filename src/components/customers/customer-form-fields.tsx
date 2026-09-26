import { SAUDI_CITIES, CITY_COORDS } from "@/lib/constants";
import RatesEditor, { type RateRow } from "@/components/customers/rates-editor";

const RATE_CITY_OPTIONS = [...Object.keys(CITY_COORDS), ...Object.keys(SAUDI_CITIES)];

export default function CustomerFormFields({
  defaults,
  showRates = true,
}: {
  defaults?: {
    name?: string;
    nameAr?: string | null;
    company?: string | null;
    contactPerson?: string | null;
    phone?: string;
    email?: string | null;
    address?: string | null;
    streetName?: string | null;
    buildingNumber?: string | null;
    district?: string | null;
    city?: string | null;
    postalCode?: string | null;
    crNumber?: string | null;
    vatNumber?: string | null;
    crDocName?: string | null;
    vatDocName?: string | null;
    paymentTerms?: string;
    creditDays?: number | null;
    rates?: RateRow[];
  };
  showRates?: boolean;
}) {
  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Company / Customer Name (English)
        </label>
        <input name="name" required defaultValue={defaults?.name ?? ""} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Company / Customer Name (Arabic) <span className="text-slate-400">اسم الشركة</span>
        </label>
        <input
          name="nameAr"
          dir="rtl"
          defaultValue={defaults?.nameAr ?? ""}
          placeholder="مثال: شركة المدينة للتجارة"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Company (Legal Entity)</label>
        <input name="company" defaultValue={defaults?.company ?? ""} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Contact Person</label>
        <input
          name="contactPerson"
          defaultValue={defaults?.contactPerson ?? ""}
          placeholder="e.g. Mohammed Al-Salem — Logistics Manager"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input
          name="phone"
          required
          defaultValue={defaults?.phone ?? ""}
          placeholder="+966 5x xxx xxxx"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input type="email" name="email" defaultValue={defaults?.email ?? ""} className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <input name="address" defaultValue={defaults?.address ?? ""} className={inputCls} />
      </div>

      <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
          NATIONAL ADDRESS (needed for ZATCA tax invoices to VAT-registered customers)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Street name</label>
            <input name="streetName" defaultValue={defaults?.streetName ?? ""} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Building number (4 digits)</label>
            <input name="buildingNumber" defaultValue={defaults?.buildingNumber ?? ""} inputMode="numeric" pattern="\d{4}" placeholder="1234" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">District</label>
            <input name="district" defaultValue={defaults?.district ?? ""} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <input name="city" defaultValue={defaults?.city ?? ""} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Postal code (5 digits)</label>
            <input name="postalCode" defaultValue={defaults?.postalCode ?? ""} inputMode="numeric" pattern="\d{5}" placeholder="12211" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="sm:col-span-2 mt-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
          LEGAL REGISTRATION (CR & VAT)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">CR Number</label>
            <input
              name="crNumber"
              defaultValue={defaults?.crNumber ?? ""}
              placeholder="Commercial Registration No."
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">VAT Number</label>
            <input
              name="vatNumber"
              defaultValue={defaults?.vatNumber ?? ""}
              placeholder="VAT Registration No."
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              CR Certificate Attachment
            </label>
            <input
              type="file"
              name="crDoc"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            {defaults?.crDocName && (
              <p className="mt-1 text-xs text-emerald-600">
                Attached: {defaults.crDocName} (upload a new file to replace)
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              VAT Certificate Attachment
            </label>
            <input
              type="file"
              name="vatDoc"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            {defaults?.vatDocName && (
              <p className="mt-1 text-xs text-emerald-600">
                Attached: {defaults.vatDocName} (upload a new file to replace)
              </p>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Accepted formats: PDF or image, up to ~7 MB each.
        </p>
      </div>

      <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
          AGREED PAYMENT TERMS (CONTRACT)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Terms</label>
            <select
              name="paymentTerms"
              defaultValue={defaults?.paymentTerms ?? "CASH"}
              className={inputCls}
            >
              <option value="CASH">Cash — invoice due on receiving originals + invoice</option>
              <option value="CREDIT">Credit — agreed credit period</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Credit Period (days){" "}
              <span className="font-normal text-slate-400">(only for credit terms)</span>
            </label>
            <input
              type="number"
              name="creditDays"
              min={1}
              defaultValue={defaults?.creditDays ?? ""}
              placeholder="e.g. 30"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {showRates && (
        <div className="sm:col-span-2">
          <RatesEditor initial={defaults?.rates ?? []} cityOptions={RATE_CITY_OPTIONS} />
        </div>
      )}
    </div>
  );
}
