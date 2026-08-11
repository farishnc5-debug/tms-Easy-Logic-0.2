"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, Menu, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";
import { NAV_SECTIONS, ALL_NAV_ITEMS } from "@/components/layout/sidebar";
import { t as tr, type Locale } from "@/lib/i18n";
import LanguageSwitch from "@/components/layout/language-switch";

type AlertT = {
  id: string;
  message: string;
  severity: string;
  read: boolean;
  createdAt: string;
};

type SearchResult = { type: string; id: string; label: string; sub: string; href: string };

function titleFor(pathname: string) {
  const match = ALL_NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  return match?.label ?? "Dashboard";
}

// Hierarchical breadcrumb trail: /shipments/abc123/edit →
// Dashboard › Shipments (Bookings) › Details › Edit. The back button always
// navigates one level UP this trail (never browser history), like other TMS.
function buildCrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/dashboard" },
  ];
  if (pathname === "/dashboard") return crumbs;

  const segments = pathname.split("/").filter(Boolean);
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const navMatch = ALL_NAV_ITEMS.find((n) => n.href === acc);
    if (navMatch) {
      crumbs.push({ label: navMatch.label, href: acc });
    } else if (seg === "new") {
      crumbs.push({ label: "New", href: acc });
    } else if (seg === "edit") {
      crumbs.push({ label: "Edit", href: acc });
    } else {
      crumbs.push({ label: "Details", href: acc });
    }
  }
  return crumbs;
}

export default function Topbar({
  user,
  initialAlerts,
  locale,
}: {
  user: { name: string; title: string | null };
  initialAlerts: AlertT[];
  locale: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = tr(titleFor(pathname), locale);
  const crumbs = buildCrumbs(pathname);
  // Back always goes one level up the hierarchy (parent crumb)
  const parentHref = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : "/dashboard";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  async function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    await fetch("/api/alerts/read-all", { method: "POST" });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <button
        className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {pathname !== "/dashboard" && (
        <button
          onClick={() => router.push(parentHref)}
          title={`Back to ${crumbs[crumbs.length - 2]?.label ?? "Dashboard"}`}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        <nav className="hidden sm:flex items-center gap-1 truncate text-xs text-slate-400">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            const label = tr(c.label, locale);
            return (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <span>{locale === "ar" ? "‹" : "›"}</span>}
                {isLast ? (
                  <span className="font-medium text-slate-500">{label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-brand-600 hover:underline">
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={tr("Search anything... (Ctrl + K)", locale)}
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute end-0 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {results.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">
                  {tr("No results found", locale)}
                </p>
              ) : (
                <ul className="max-h-96 overflow-y-auto">
                  {results.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <Link
                        href={r.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                        }}
                        className="flex flex-col rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-800">{r.label}</span>
                        <span className="text-xs text-slate-400">
                          {r.type} · {r.sub}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <LanguageSwitch locale={locale} />

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute end-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{tr("Notifications", locale)}</p>
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-sky-600 hover:underline"
                >
                  {tr("Mark all read", locale)}
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {alerts.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-slate-400">
                    No notifications
                  </li>
                )}
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className={`flex gap-2 border-b border-slate-50 px-4 py-3 text-sm ${!a.read ? "bg-sky-50/50" : ""}`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        a.severity === "CRITICAL"
                          ? "bg-red-500"
                          : a.severity === "WARNING"
                            ? "bg-amber-500"
                            : "bg-sky-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-slate-700">{a.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100"
          >
            <Avatar name={user.name} size={36} />
            <div className="hidden text-start sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">{user.name}</p>
              <p className="text-xs leading-tight text-slate-400">{user.title ?? "Team member"}</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute end-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setProfileOpen(false)}
              >
                {tr("Profile & Settings", locale)}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="block w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                >
                  {tr("Sign out", locale)}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute start-0 top-0 h-full w-72 overflow-y-auto bg-[#0b1b3a] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold leading-tight tracking-wide text-white">
                  Easy <span className="text-sky-400">Logic</span>
                </p>
                <p className="text-[9px] tracking-[0.25em] text-slate-400">
                  INTELLIGENT LOGISTICS OS
                </p>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-3">
              <LanguageSwitch locale={locale} variant="sidebar" />
            </div>
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="mb-1 px-2 text-[10px] font-semibold tracking-widest text-slate-400">
                  {tr(section.title, locale)}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                            active
                              ? "bg-sky-500/15 text-sky-300 font-medium"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon size={18} />
                          <span>{tr(item.label, locale)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
