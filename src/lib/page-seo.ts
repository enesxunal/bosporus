import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Tüm public SEO Almanca — locale sadece noindex / hreflang için */
export const SITE_SEO = {
  title: "Bosporus GmbH – Großhandel Köln | Lebensmittel online",
  description:
    "Lebensmittel-Großhandel in Köln: Getränke, Tiefkühl, Verpackung & mehr für Gastronomie und Privatkunden. Lieferung und Abholung.",
} as const;

const PAGES: Record<string, { title: string; description: string }> = {
  "/": SITE_SEO,
  "/products": {
    title: "Produkte & Sortiment",
    description:
      "Lebensmittel, Getränke, Tiefkühl, Verpackung und mehr – Großhandel Köln online bestellen bei Bosporus.",
  },
  "/about": {
    title: "Über uns",
    description:
      "Bosporus GmbH – Ihr Lebensmittel-Großhandel in Köln mit über 40 Jahren Erfahrung für Gastronomie und Privatkunden.",
  },
  "/contact": {
    title: "Kontakt",
    description:
      "Kontakt zu Bosporus GmbH in Köln – Telefon, E-Mail und Anfahrt. Wir beraten Gastronomie und Privatkunden.",
  },
  "/gewerbe": {
    title: "Gewerbe & Nettopreise",
    description:
      "Gewerbekonto bei Bosporus Köln: Nettopreise für Gastronomie, Imbiss und Handel. Jetzt registrieren.",
  },
  "/grosshandel": {
    title: "Großhandel Köln – ca. 20% günstiger für Gewerbe",
    description:
      "Bosporus Gewerbeportal: Nettopreise, schnelle Bestellung, Lieferung Köln. Für Gastronomie und Handel registrieren.",
  },
  "/gewerbe/register": {
    title: "Gewerbe registrieren",
    description:
      "Als Gewerbekunde bei Bosporus registrieren und Nettopreise freischalten lassen.",
  },
  "/cart": {
    title: "Warenkorb",
    description: "Ihr Warenkorb bei Bosporus Großhandel Köln.",
  },
  "/checkout": {
    title: "Kasse",
    description: "Bestellung abschließen – Lieferung oder Abholung in Köln und Umgebung.",
  },
  "/checkout/success": {
    title: "Bestellung bestätigt",
    description: "Vielen Dank für Ihre Bestellung bei Bosporus GmbH.",
  },
  "/login": {
    title: "Anmelden",
    description: "Bei Bosporus anmelden – Privat- und Gewerbekunden.",
  },
  "/register": {
    title: "Registrieren",
    description: "Kundenkonto bei Bosporus Köln erstellen und online bestellen.",
  },
  "/faq": {
    title: "Häufige Fragen",
    description: "FAQ zu Bestellung, Lieferung, Abholung und Gewerbekonto bei Bosporus Köln.",
  },
  "/impressum": {
    title: "Impressum",
    description: "Impressum der BOSPORUS Handelsgesellschaft mbH, Köln.",
  },
  "/datenschutz": {
    title: "Datenschutz",
    description: "Datenschutzerklärung der Bosporus GmbH.",
  },
  "/agb": {
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen der Bosporus GmbH.",
  },
  "/widerruf": {
    title: "Widerruf",
    description: "Widerrufsbelehrung der Bosporus GmbH.",
  },
  "/order/track": {
    title: "Bestellung verfolgen",
    description: "Bestellstatus bei Bosporus mit Bestellnummer und E-Mail prüfen.",
  },
  "/account": {
    title: "Mein Konto",
    description: "Ihr Kundenkonto bei Bosporus GmbH.",
  },
  "/forgot-password": {
    title: "Passwort vergessen",
    description: "Passwort zurücksetzen – Bosporus Kundenkonto.",
  },
  "/reset-password": {
    title: "Neues Passwort",
    description: "Neues Passwort für Ihr Bosporus Konto setzen.",
  },
  "/verify-email": {
    title: "E-Mail bestätigen",
    description: "E-Mail-Adresse bestätigen – Bosporus GmbH.",
  },
};

function deUrl(path: string): string {
  if (!path || path === "/") return absoluteUrl("/");
  return absoluteUrl(path.startsWith("/") ? path : `/${path}`);
}

function trUrl(path: string): string {
  if (!path || path === "/") return absoluteUrl("/tr");
  return absoluteUrl(`/tr${path.startsWith("/") ? path : `/${path}`}`);
}

/** Sayfa SEO – her zaman Almanca metin, DE canonical */
export function shopPageMetadata(path: string, locale: string): Metadata {
  const page = PAGES[path] ?? {
    title: "Bosporus",
    description: SITE_SEO.description,
  };
  const canonical = deUrl(path);
  const isTr = locale === "tr";

  return {
    title: path === "/" ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: {
      canonical,
      languages: {
        de: deUrl(path),
        "de-DE": deUrl(path),
        tr: trUrl(path),
        "x-default": deUrl(path),
      },
    },
    openGraph: {
      title: path === "/" ? page.title : `${page.title} | Bosporus`,
      description: page.description,
      url: canonical,
      locale: "de_DE",
      alternateLocale: ["tr_TR"],
      type: "website",
      siteName: "Bosporus",
    },
    robots: isTr
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}
