"use client";

import { createContext, useContext } from "react";
import { t, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

// Read the active locale in any client component (set server-side from the cookie)
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// Translate helper bound to the active locale
export function useT() {
  const locale = useLocale();
  return (key: string) => t(key, locale);
}
