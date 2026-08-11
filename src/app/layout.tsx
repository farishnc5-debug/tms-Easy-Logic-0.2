import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { isRtl } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Easy Logic — Intelligent Logistics OS",
  description: "Easy Logic TMS — the SaaS transport management system",
  applicationName: "Easy Logic",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // iPhone "Add to Home Screen" full-screen support
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Easy Logic",
  },
};

export const viewport = {
  themeColor: "#0b1b3a",
  width: "device-width",
  initialScale: 1,
  // Allow pinch zoom (accessibility) but render app-like by default
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const rtl = isRtl(locale);

  return (
    <html
      lang={locale}
      dir={rtl ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
