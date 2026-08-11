import type { MetadataRoute } from "next";

// PWA manifest — makes the app installable from Chrome (Android) and Safari
// (iPhone) via "Add to Home Screen": full-screen, own icon, no browser bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Logic — Intelligent Logistics OS",
    short_name: "Easy Logic",
    description:
      "Easy Logic TMS — bookings, dispatch, live tracking, trip money, invoicing and fleet maintenance for transport companies.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1b3a",
    theme_color: "#0b1b3a",
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity", "logistics"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
