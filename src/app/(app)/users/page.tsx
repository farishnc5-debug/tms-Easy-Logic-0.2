import Link from "next/link";
import { UserCog, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <UserCog size={16} /> {users.length} team member{users.length === 1 ? "" : "s"}
        </div>
        <Link
          href="/users/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> Invite User
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size={32} />
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill className="bg-slate-100 text-slate-600">{ROLE_LABELS[u.role] ?? u.role}</Pill>
                    <p className="mt-0.5 text-xs text-slate-400">{u.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.phone ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Pill className={u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {u.active ? "Active" : "Disabled"}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/users/${u.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
