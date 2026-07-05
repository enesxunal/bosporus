import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMPANY.tradeName} – Großhandel Köln`,
    short_name: COMPANY.tradeName,
    description: "Lebensmittel-Großhandel für Gastronomie und Privatkunden in Köln",
    start_url: "/",
    display: "standalone",
    background_color: "#002d5b",
    theme_color: "#1d71b8",
    lang: "de",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
