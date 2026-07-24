import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMPANY.tradeName} – Großhandel Köln`,
    short_name: COMPANY.tradeName,
    description: "Lebensmittel-Großhandel für Gastronomie und Gewerbe in Köln – Nettopreise nach Freigabe",
    start_url: "/",
    display: "standalone",
    background_color: "#002d5b",
    theme_color: "#1d71b8",
    lang: "de",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
