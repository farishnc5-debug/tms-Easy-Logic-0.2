import type { CompanyProfile } from "@prisma/client";

// Letterhead used on every printed document: bilingual name, legal ids, contacts
export default function CompanyHeader({
  company,
  docTitle,
  docTitleAr,
}: {
  company: CompanyProfile;
  docTitle: string;
  docTitleAr?: string;
}) {
  return (
    <div>
      {/* Brand banner — company name in big letters at the top of every document */}
      <p className="text-center text-4xl font-extrabold uppercase tracking-wider text-[#0b1b3a]">
        {company.name}
      </p>
      {company.tagline && (
        <p className="mt-0.5 text-center text-xs text-slate-500">{company.tagline}</p>
      )}
      <div className="mt-3 flex items-start justify-between gap-4 border-b-4 border-[#0b1b3a] pb-4">
        <div>
          <div className="mt-2 space-y-0.5 text-[11px] leading-snug text-slate-600">
            {company.address && (
              <p>
                {company.address}
                {company.city ? `, ${company.city}` : ""}
                {company.country ? `, ${company.country}` : ""}
              </p>
            )}
            <p>
              {company.phone && <span>Tel: {company.phone}</span>}
              {company.phone2 && <span> / {company.phone2}</span>}
              {company.email && <span> · {company.email}</span>}
            </p>
            {company.website && <p>{company.website}</p>}
          </div>
        </div>
        <div className="text-right">
          {company.nameAr && (
            <p dir="rtl" className="text-2xl font-bold text-[#0b1b3a]">
              {company.nameAr}
            </p>
          )}
          <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
            {company.crNumber && <p>C.R. No: {company.crNumber}</p>}
            {company.vatNumber && <p>VAT No: {company.vatNumber}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <h1 className="text-lg font-bold uppercase tracking-widest text-[#0b1b3a]">{docTitle}</h1>
        {docTitleAr && (
          <span dir="rtl" className="text-lg font-bold text-[#0b1b3a]">
            {docTitleAr}
          </span>
        )}
      </div>
    </div>
  );
}
