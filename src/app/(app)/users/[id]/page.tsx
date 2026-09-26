import { requirePageCapability } from "@/lib/page-guards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { updateUser, deleteUser } from "@/lib/actions/users";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { Avatar } from "@/components/ui/avatar";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageCapability("admin");
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const action = updateUser.bind(null, id);
  const del = deleteUser.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/users" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Users
        </Link>
        <form action={del}>
          <ConfirmSubmitButton
            message={`Remove ${user.name}?`}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Remove
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="flex items-center gap-4 card p-6">
        <Avatar name={user.name} size={56} />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="card p-6">
        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input name="name" required defaultValue={user.name} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select name="role" defaultValue={user.role} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input name="title" defaultValue={user.title ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" defaultValue={user.phone ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reset Password (optional)</label>
            <input type="password" name="password" minLength={6} placeholder="Leave blank to keep current password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="active" defaultChecked={user.active} className="h-4 w-4 rounded border-slate-300" />
            Account active
          </label>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
