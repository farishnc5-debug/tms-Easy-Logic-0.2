"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import LanguageSwitch from "@/components/layout/language-switch";
import {
  LayoutDashboard,
  Package,
  Truck,
  Send,
  TruckIcon,
  Users,
  MapPin,
  RefreshCcw,
  ClipboardList,
  FileText,
  AlertTriangle,
  BadgeCheck,
  UserCog,
  Building2,
  Settings,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  FileSignature,
  Landmark,
  BadgeDollarSign,
  History,
  Wrench,
  ClipboardCheck,
  Route,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export type NavSectionT = { title: string; items: NavItem[] };

// Sections follow the freight workflow order used by international TMS
// platforms: sell → book → plan → execute → prove → assets → admin.
export const NAV_SECTIONS: NavSectionT[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Operations Guide", href: "/operations-guide", icon: ClipboardCheck },
    ],
  },
  {
    title: "COMMERCIAL",
    items: [
      { label: "Quotations", href: "/quotations", icon: FileSignature },
      { label: "Carrier Tariff Book", href: "/tariff", icon: Route },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Shipments (Bookings)", href: "/shipments", icon: Package },
      { label: "Dispatching", href: "/dispatching", icon: Send },
      { label: "Trips", href: "/trips", icon: Truck },
      { label: "Live Map Tracking", href: "/map-tracking", icon: MapPin },
      { label: "Logistics Cycle", href: "/logistics-cycle", icon: RefreshCcw },
      { label: "Tasks & Activities", href: "/tasks", icon: ClipboardList },
    ],
  },
  {
    title: "DELIVERY & PROOF",
    items: [
      { label: "POD & Proof", href: "/pod", icon: BadgeCheck },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Incidents", href: "/incidents", icon: AlertTriangle },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Payment Follow-up", href: "/settlements", icon: BadgeDollarSign },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { label: "Fleet", href: "/fleet", icon: TruckIcon },
      { label: "Drivers", href: "/drivers", icon: Users },
      { label: "Vendors & Suppliers", href: "/vendors", icon: Building2 },
    ],
  },
  {
    title: "MAINTENANCE",
    items: [{ label: "Fleet Maintenance", href: "/maintenance", icon: Wrench }],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Company Profile", href: "/company", icon: Landmark },
      { label: "Users & Roles", href: "/users", icon: UserCog },
      { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
      { label: "Activity Log", href: "/activity", icon: History },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

function NavSection({
  title,
  items,
  pathname,
  collapsed,
  locale,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  locale: Locale;
}) {
  return (
    <div className="px-3">
      {!collapsed && (
        <p className="px-3 pb-2 pt-4 text-[10px] font-semibold tracking-widest text-slate-400">
          {t(title, locale)}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? t(item.label, locale) : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-500/20 text-brand-300 font-medium"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{t(item.label, locale)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar({
  locale,
  companyName,
}: {
  locale: Locale;
  // Subscriber (tenant) company name from Company Profile
  companyName?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex h-screen sticky top-0 flex-col bg-brand-950 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="px-4 py-5">
        {!collapsed ? (
          <>
            <p className="text-xl font-extrabold leading-tight tracking-wide text-white">
              Easy <span className="text-brand-400">Logic</span>
            </p>
            <p className="text-[9px] tracking-[0.25em] text-slate-400">
              {t("INTELLIGENT LOGISTICS OS", locale)}
            </p>
            {companyName && (
              <p className="mt-2 truncate rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-brand-200">
                {companyName}
              </p>
            )}
          </>
        ) : (
          <div className="mx-auto text-center text-lg font-extrabold text-white">
            E<span className="text-brand-400">L</span>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto pb-4">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.title}>
            {i > 0 && <div className="my-2 border-t border-white/10" />}
            <NavSection
              title={section.title}
              items={section.items}
              pathname={pathname}
              collapsed={collapsed}
              locale={locale}
            />
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <LanguageSwitch locale={locale} variant="sidebar" />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>{t("Collapse", locale)}</span>}
        </button>
      </div>
    </aside>
  );
}
