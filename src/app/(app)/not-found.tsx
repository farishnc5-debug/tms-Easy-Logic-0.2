import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <SearchX size={24} />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Not found</h2>
      <p className="mt-1 text-sm text-slate-500">
        We couldn&apos;t find that record. It may have been deleted or the link is wrong.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
