import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewUserForm from "@/components/users/new-user-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/users" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Users
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Invite User</h2>
        <p className="mb-5 text-sm text-slate-500">Create a new team account.</p>
        <NewUserForm />
      </div>
    </div>
  );
}
