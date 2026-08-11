import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

// Server-only: read the chosen locale from the cookie (defaults to English).
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return v === "ar" ? "ar" : "en";
}
