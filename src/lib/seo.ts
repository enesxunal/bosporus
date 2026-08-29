import type { Metadata } from "next";
import { COMPANY, storeOpeningHoursJsonLd } from "@/lib/company";
import { getCategorySeo } from "@/lib/category-seo";
import { getProductImageUrl } from "@/lib/category-images";
import { isPaymentTestSku } from "@/lib/payment-test-product";
import { getB2cGross, hasSellablePrice } from "@/lib/pricing";
import type { Category, Product } from "@/lib/types";

const BASE = COMPANY.website.replace(/\/$/, "");

/** Root layout template suffix — child titles must NOT include this */
export const METADATA_BRAND = "Bosporus";

const TRAILING_BRAND_RE = /\s\|\s*Bosporus(\s+GmbH|\s+Großhandel)?\s*$/i;

/** Strip trailing brand suffix so layout template `%s | Bosporus` applies once */
export function metadataTitleSegment(title: string): string {
  let segment = title.trim();
  while (TRAILING_BRAND_RE.test(segment)) {
    segment = segment.replace(TRAILING_BRAND_RE, "").trim();
  }
  return segment;
}

/** Full document/OG title after template is applied */
export function resolveMetadataTitle(segment: string): string {
  return `${metadataTitleSegment(segment)} | ${METADATA_BRAND}`;
}

/** Simulates root layout title template for tests */
export function applyMetadataTitleTemplate(segment: string): string {
  return resolveMetadataTitle(segment);
}

export function hasDuplicateBrandInTitle(title: string): boolean {
  return (title.match(/\|\s*Bosporus\b/gi) ?? []).length > 1;
}

export type BreadcrumbItem = { name: string; href?: string };

export type FaqItem = { question: string; answer: string };

/** Priority product SEO enhancements (Search Console opportunities) */
const PRODUCT_SEO_OVERRIDES: Record<
  string,
  { description?: string; titleSuffix?: string }
> = {
  "ayfit-ayran-250ml": {
    description:
      "Ayfit Ayran 250 ml im Bosporus Großhandel Köln – für Gastronomie, Dönerladen und Lebensmittelhandel. Online für Gewerbekunden, vor Ort auch für Privatkunden.",
  },
  "mr-oxy-vollwaschmittel-xxxl-85-w-5-1kg-gratis-mr-oxy-weichsp": {
    description:
      "Mr Oxy Vollwaschmittel XXXL 85W 5,1 kg im Bosporus Großhandel Köln – Reinigungsmittel für Gastronomie und Gewerbe.",
  },
  "tiger-chips-paprika-90gr": {
    description:
      "Tiger Chips Paprika 90 g im Bosporus Großhandel Köln – Snacks für Kiosk, Imbiss und Wiederverkauf.",
  },
  "real-american-chicken-nuggets-halal-1kg-halal": {
    description:
      "Real American Chicken Nuggets Halal 1 kg im Bosporus Tiefkühl-Großhandel Köln – für Imbiss, Restaurant und Gastronomie.",
  },
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productPath(locale: string, sku: string): string {
  const prefix = locale === "de" ? "" : `/${locale}`;
  return `${prefix}/product/${encodeURIComponent(sku)}`;
}

export function categoryPath(locale: string, slug: string): string {
  const prefix = locale === "de" ? "" : `/${locale}`;
  return `${prefix}/products/${slug}`;
}

function buildProductTitle(product: Product): string {
  const name = product.name_de.trim();
  const brand = product.brand?.trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    return `${name} | ${brand} | Großhandel Köln`;
  }
  const override = PRODUCT_SEO_OVERRIDES[product.sku];
  if (override?.titleSuffix) {
    return `${name} | ${override.titleSuffix}`;
  }
  if (name.length > 55) return name;
  return `${name} | Großhandel Köln`;
}

function buildProductDescription(product: Product): string {
  const override = PRODUCT_SEO_OVERRIDES[product.sku];
  if (override?.description) return override.description.slice(0, 160);
  if (product.description_de?.trim()) return product.description_de.trim().slice(0, 160);
  const name = product.name_de.trim();
  const cat = product.category_name_de;
  if (cat) {
    return `${name} – ${cat} Großhandel Köln für Gastronomie und Handel | Bosporus GmbH`.slice(0, 160);
  }
  return `${name} – Großhandel Köln für Gastronomie und Gewerbe | Bosporus GmbH`.slice(0, 160);
}

/** SEO her zaman Almanca (name_de) — Google Ads / DE pazar */
export function productMetadata(product: Product, locale: string): Metadata {
  const name = product.name_de;
  const desc = buildProductDescription(product);
  const image = getProductImageUrl(product);
  const url = absoluteUrl(productPath("de", product.sku));
  const isTr = locale === "tr";
  const titleSegment = metadataTitleSegment(buildProductTitle(product));

  if (isPaymentTestSku(product.sku)) {
    return {
      title: name,
      description: desc.slice(0, 160),
      robots: { index: false, follow: false, nocache: true },
      openGraph: {
        title: name,
        description: desc.slice(0, 160),
        url: absoluteUrl(productPath(locale === "tr" ? "tr" : "de", product.sku)),
        type: "website",
        locale: isTr ? "tr_TR" : "de_DE",
        images: [{ url: absoluteUrl(image) }],
      },
    };
  }

  return {
    title: titleSegment,
    description: desc,
    alternates: {
      canonical: url,
      languages: {
        de: absoluteUrl(productPath("de", product.sku)),
        "de-DE": absoluteUrl(productPath("de", product.sku)),
        tr: absoluteUrl(productPath("tr", product.sku)),
        "x-default": absoluteUrl(productPath("de", product.sku)),
      },
    },
    openGraph: {
      title: resolveMetadataTitle(titleSegment),
      description: desc,
      url,
      type: "website",
      locale: "de_DE",
      images: [{ url: absoluteUrl(image) }],
    },
    robots: isTr
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export function categoryMetadata(
  category: Category,
  locale: string,
  image: string
): Metadata {
  const seo = getCategorySeo(category);
  const url = absoluteUrl(categoryPath("de", category.slug));
  const isTr = locale === "tr";
  const titleSegment = metadataTitleSegment(seo.title);

  return {
    title: titleSegment,
    description: seo.description,
    alternates: {
      canonical: url,
      languages: {
        de: absoluteUrl(categoryPath("de", category.slug)),
        "de-DE": absoluteUrl(categoryPath("de", category.slug)),
        tr: absoluteUrl(categoryPath("tr", category.slug)),
        "x-default": absoluteUrl(categoryPath("de", category.slug)),
      },
    },
    openGraph: {
      title: resolveMetadataTitle(titleSegment),
      description: seo.description,
      url,
      type: "website",
      locale: "de_DE",
      images: [{ url: absoluteUrl(image) }],
    },
    robots: isTr
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE}/#organization`,
    name: COMPANY.legalName,
    alternateName: [COMPANY.tradeName, "Bosporus GmbH"],
    legalName: COMPANY.legalName,
    url: BASE,
    logo: absoluteUrl("/icon-192.png"),
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.street,
      addressLocality: COMPANY.city,
      postalCode: COMPANY.zip,
      addressCountry: "DE",
    },
    vatID: COMPANY.vatId,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.phone,
      contactType: "customer service",
      availableLanguage: ["German", "Turkish"],
      areaServed: "DE",
    },
    openingHoursSpecification: storeOpeningHoursJsonLd(),
  };
}

/** LocalBusiness + WholesaleStore for physical location */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "WholesaleStore"],
    "@id": `${BASE}/#localbusiness`,
    name: `${COMPANY.tradeName} Großhandel Köln`,
    alternateName: COMPANY.legalName,
    url: BASE,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    image: absoluteUrl("/categories/lebensmittel.jpg"),
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.street,
      addressLocality: COMPANY.city,
      postalCode: COMPANY.zip,
      addressCountry: "DE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 50.9667,
      longitude: 6.9167,
    },
    openingHoursSpecification: storeOpeningHoursJsonLd(),
    parentOrganization: { "@id": `${BASE}/#organization` },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE}/#website`,
    name: "Bosporus GmbH",
    url: BASE,
    publisher: { "@id": `${BASE}/#organization` },
    inLanguage: "de-DE",
  };
}

export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), localBusinessJsonLd(), websiteJsonLd()],
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function faqJsonLd(faq: FaqItem[]) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function productJsonLd(product: Product, locale: string) {
  const name = product.name_de;
  const image = absoluteUrl(getProductImageUrl(product));
  const gtin = product.barcode?.replace(/\D/g, "") ?? "";
  const brandName = product.brand?.trim() || COMPANY.tradeName;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.sku,
    image,
    description: product.description_de || name,
    brand: { "@type": "Brand", name: brandName },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productPath(locale === "tr" ? "tr" : "de", product.sku)),
      priceCurrency: "EUR",
      price: getB2cGross(product).toFixed(2),
      availability:
        product.is_active && hasSellablePrice(product)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: COMPANY.legalName },
    },
  };

  if (gtin.length >= 8 && gtin.length <= 14) {
    schema.gtin = gtin;
  }
  if (product.mpn?.trim()) {
    schema.mpn = product.mpn.trim();
  }

  return schema;
}

/** Homepage FAQ – visible content must match */
export const HOME_FAQ: FaqItem[] = [
  {
    question: "Kann man bei Bosporus auch als Privatkunde einkaufen?",
    answer:
      "Ja. Der Online-Shop richtet sich an Gewerbekunden. An unserem Standort in Köln-Ossendorf können jedoch auch Privatkunden direkt vor Ort einkaufen.",
  },
  {
    question: "Kann ich als Privatkunde online bestellen?",
    answer:
      "Nein. Der Online-Shop und Checkout sind ausschließlich für freigeschaltete Gewerbekunden vorgesehen. Privatkunden können vor Ort einkaufen.",
  },
  {
    question: "Gibt es Parkplätze?",
    answer: "Ja, Parkmöglichkeiten stehen direkt am Standort zur Verfügung.",
  },
  {
    question: "Wo befindet sich Bosporus in Köln?",
    answer: "Von-Hünefeld-Str. 2, 50829 Köln (Ossendorf).",
  },
  {
    question: "Für wen ist der Bosporus Großhandel geeignet?",
    answer:
      "Gastronomie, Restaurants, Imbisse, Kioske, Cafés, Einzelhandel, Wiederverkäufer und weitere Gewerbekunden.",
  },
  {
    question: "Wann hat Bosporus in Köln-Ossendorf geöffnet?",
    answer:
      "Mo.–Fr.: 00:00–18:00 Uhr, Sa.: 00:00–16:00 Uhr, So.: geschlossen. Einkauf vor Ort für Privatkunden während dieser Zeiten möglich.",
  },
];

export function ratgeberMetadata(
  title: string,
  description: string,
  slug: string,
  locale: string
): Metadata {
  const url = absoluteUrl(`/ratgeber/${slug}`);
  const isTr = locale === "tr";
  const titleSegment = metadataTitleSegment(title);
  return {
    title: titleSegment,
    description,
    alternates: {
      canonical: url,
      languages: {
        de: url,
        "de-DE": url,
        tr: absoluteUrl(`/tr/ratgeber/${slug}`),
        "x-default": url,
      },
    },
    openGraph: {
      title: resolveMetadataTitle(titleSegment),
      description,
      url,
      locale: "de_DE",
      type: "article",
    },
    robots: isTr ? { index: false, follow: true } : { index: true, follow: true },
  };
}
