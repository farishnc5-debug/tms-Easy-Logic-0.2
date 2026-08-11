import { Building2, Landmark, FileCheck2 } from "lucide-react";
import { getCompanyProfile } from "@/lib/company";
import { updateCompanyProfile } from "@/lib/actions/company";

export const dynamic = "force-dynamic";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  dir,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        dir={dir}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [profile, sp] = await Promise.all([getCompanyProfile(), searchParams]);
  const saved = sp.saved === "1";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Company Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          This legal and contact information is printed on every document the system produces —
          waybills, quotations and receipts.
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-600/20">
          Company profile saved. All printed documents now use the updated details.
        </div>
      )}

      <form action={updateCompanyProfile} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400">
            <Building2 size={14} /> BASIC INFORMATION
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company Name (English)" name="name" defaultValue={profile.name} required />
            <Field label="Company Name (Arabic)" name="nameAr" defaultValue={profile.nameAr} dir="rtl" />
            <div className="sm:col-span-2">
              <Field label="Tagline / Activity" name="tagline" defaultValue={profile.tagline} placeholder="Road Freight & Logistics Services" />
            </div>
            <Field label="Phone" name="phone" defaultValue={profile.phone} placeholder="+966 5X XXX XXXX" />
            <Field label="Phone 2 (optional)" name="phone2" defaultValue={profile.phone2} />
            <Field label="Email" name="email" defaultValue={profile.email} placeholder="info@company.sa" />
            <Field label="Website" name="website" defaultValue={profile.website} placeholder="www.company.sa" />
            <div className="sm:col-span-2">
              <Field label="Address" name="address" defaultValue={profile.address} placeholder="Street, District" />
            </div>
            <Field label="City" name="city" defaultValue={profile.city} />
            <Field label="Country" name="country" defaultValue={profile.country} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400">
            <FileCheck2 size={14} /> LEGAL REGISTRATION
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CR Number (Commercial Registration)" name="crNumber" defaultValue={profile.crNumber} placeholder="1010XXXXXX" />
            <Field label="VAT Registration Number" name="vatNumber" defaultValue={profile.vatNumber} placeholder="3XXXXXXXXXXXXX3" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400">
            <Landmark size={14} /> BANK ACCOUNT DETAILS
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bank Name" name="bankName" defaultValue={profile.bankName} placeholder="Al Rajhi Bank" />
            <Field label="Beneficiary Name" name="bankBeneficiary" defaultValue={profile.bankBeneficiary} placeholder="Company legal name" />
            <Field label="IBAN" name="bankIban" defaultValue={profile.bankIban} placeholder="SA00 0000 0000 0000 0000 0000" />
            <Field label="Account Number" name="bankAccount" defaultValue={profile.bankAccount} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Save Company Profile
          </button>
        </div>
      </form>
    </div>
  );
}
