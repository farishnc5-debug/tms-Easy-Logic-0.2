"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitch({
  locale,
  variant = "topbar",
}: {
  locale: Locale;
  variant?: "topbar" | "sidebar";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function switchTo(next: Locale) {
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  const next: Locale = locale === "ar" ? "en" : "ar";
  const nextLabel = locale === "ar" ? "English" : "العربية";

  if (variant === "sidebar") {
    return (
      <button
        onClick={() => switchTo(next)}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60"
      >
        <Languages size={18} />
        <span>{nextLabel}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => switchTo(next)}
      disabled={pending}
      title={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
    >
      <Languages size={17} />
      <span className="hidden sm:inline">{nextLabel}</span>
    </button>
  );
}
