import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Tüm public SEO Almanca — locale sadece noindex / hreflang için */
export const SITE_SEO = {
  title: "Bosporus GmbH – Lebensmittel-Großhandel Köln | Gewerbe",
  description:
    "Lebensmittel-Großhandel in Köln für Gastronomie und Handel: Nettopreise nach Freigabe, Min. 500 €, erste Lieferung gratis. Jetzt Gewerbekonto beantragen.",
} as const;

const PAGES: Record<string, { title: string; description: string }> = {
  "/": SITE_SEO,
  "/products": {
    title: "Produkte & Sortiment – Nettopreise nach Freigabe",
    description:
      "Lebensmittel, Getränke, Tiefkühl, Verpackung und mehr für Gastronomie. Preise nach Gewerbe-Freigabe – online bestellen bei Bosporus Köln.",
  },
  "/about": {
    title: "Über uns",
    description:
      "Bosporus GmbH – Lebensmittel-Großhandel in Köln mit über 40 Jahren Erfahrung für Gastronomie und Gewerbe.",
  },
  "/contact": {
    title: "Kontakt",
    description:
      "Kontakt zu Bosporus GmbH in Köln – Telefon, E-Mail und Anfahrt. Beratung für Gastronomie und Gewerbekunden.",
  },
  "/gewerbe": {
    title: "Gewerbe – Preise nach Freigabe",
    description:
      "Gewerbekonto bei Bosporus Köln: nach Freigabe Nettopreise und Bestellung. Sortiment unter Produkte.",
  },
  "/grosshandel": {
    title: "Großhandel Köln – Gewerbe registrieren",
    description:
      "Bosporus für Gastronomie und Handel: Nettopreise nach Freigabe, Min. 500 €, erste Lieferung gratis. Jetzt registrieren.",
  },
  "/gewerbe/register": {
    title: "Gewerbe registrieren",
    description:
      "Als Gewerbekunde bei Bosporus registrieren und nach Freigabe Nettopreise sowie Bestellung nutzen.",
  },
  "/cart": {
    title: "Warenkorb",
    description: "Warenkorb – Bosporus Großhandel Köln. Preise und Kasse nach Gewerbe-Freigabe.",
  },
  "/checkout": {
    title: "Kasse",
    description: "Bestellung abschließen – Lieferung oder Abholung für freigeschaltete Gewerbekunden in Köln.",
  },
  "/checkout/success": {
    title: "Bestellung bestätigt",
    description: "Vielen Dank für Ihre Bestellung bei Bosporus GmbH.",
  },
  "/login": {
    title: "Anmelden",
    description: "Gewerbekonto bei Bosporus anmelden – Preise und Bestellung nach Freigabe.",
  },
  "/register": {
    title: "Gewerbe registrieren",
    description:
      "Gewerbekonto bei Bosporus Köln erstellen (USt-IdNr.). Nach Freigabe: Nettopreise, Min. 500 €, erste Lieferung gratis.",
  },
  "/faq": {
    title: "Häufige Fragen",
    description: "FAQ zu Gewerbekonto, Nettopreisen, Lieferung und Abholung bei Bosporus Köln.",
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
    description: "Ihr Gewerbekonto bei Bosporus GmbH.",
  },
  "/forgot-password": {
    title: "Passwort vergessen",
    description: "Passwort zurücksetzen – Bosporus Gewerbekonto.",
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
