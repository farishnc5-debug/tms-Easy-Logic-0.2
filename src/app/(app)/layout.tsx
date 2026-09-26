import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { getLocale } from "@/lib/i18n.server";
import AlarmWatcher from "@/components/alarms/alarm-watcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [alerts, locale] = await Promise.all([
    db.alert.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    getLocale(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar locale={locale} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            locale={locale}
            user={{ name: user.name, title: user.title }}
            initialAlerts={alerts.map((a) => ({
              id: a.id,
              message: a.message,
              severity: a.severity,
              read: a.read,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
          <main className="page-in flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <AlarmWatcher locale={locale} />
    </LocaleProvider>
  );
}
