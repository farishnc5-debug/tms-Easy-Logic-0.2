import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateUser } from "@/lib/actions/users";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { UsageGuide, DeployGuide, TeamGuide } from "@/components/settings/how-to-guide";

const TABS = [
  { key: "profile", label: "My Profile" },
  { key: "team", label: "Team, Roles & Subscription" },
  { key: "howto", label: "How To Use (Step by Step)" },
  { key: "deploy", label: "Install & Put Online" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && TABS.some((t) => t.key === sp.tab) ? sp.tab : "profile";

  const action = updateUser.bind(null, user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-2 pt-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "profile" ? "/settings" : `/settings?tab=${t.key}`}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "team" && <TeamGuide />}
      {tab === "howto" && <UsageGuide />}
      {tab === "deploy" && <DeployGuide />}

      {tab === "profile" && (
        <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <Avatar name={user.name} size={56} />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">MY PROFILE</p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="role" value={user.role} />
          <input type="hidden" name="active" value="on" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              name="name"
              required
              defaultValue={user.name}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input
                name="title"
                defaultValue={user.title ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                name="phone"
                defaultValue={user.phone ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Change Password</label>
            <input
              type="password"
              name="password"
              minLength={6}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400">COMPANY PROFILE</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Company Name</dt>
            <dd className="font-medium text-slate-700">Easy Logic Logistics Co.</dd>
          </div>
          <div>
            <dt className="text-slate-400">Headquarters</dt>
            <dd className="font-medium text-slate-700">Riyadh, Saudi Arabia</dd>
          </div>
          <div>
            <dt className="text-slate-400">Fleet Base</dt>
            <dd className="font-medium text-slate-700">Jeddah Warehouse, Riyadh DC, Dammam Port</dd>
          </div>
          <div>
            <dt className="text-slate-400">Support Contact</dt>
            <dd className="font-medium text-slate-700">ops@easylogic.sa</dd>
          </div>
        </dl>
      </div>
        </div>
      )}
    </div>
  );
}
