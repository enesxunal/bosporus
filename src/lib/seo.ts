import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { getProductImageUrl } from "@/lib/category-images";
import { isPaymentTestSku } from "@/lib/payment-test-product";
import { getB2cGross, hasSellablePrice } from "@/lib/pricing";
import type { Category, Product } from "@/lib/types";

const BASE = COMPANY.website.replace(/\/$/, "");

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

/** SEO her zaman Almanca (name_de) — Google Ads / DE pazar */
export function productMetadata(product: Product, locale: string): Metadata {
  const name = product.name_de;
  const desc =
    product.description_de ||
    `${name} – Großhandel Köln | Bosporus GmbH`;
  const image = getProductImageUrl(product);
  const url = absoluteUrl(productPath("de", product.sku));
  const isTr = locale === "tr";

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
    title: name,
    description: desc.slice(0, 160),
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
      title: name,
      description: desc.slice(0, 160),
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
  const name = category.name_de;
  const desc = `${name} – ${category.product_count} Artikel | Großhandel Köln | Bosporus GmbH`;
  const url = absoluteUrl(categoryPath("de", category.slug));
  const isTr = locale === "tr";

  return {
    title: name,
    description: desc,
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
      title: name,
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

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.legalName,
    alternateName: COMPANY.tradeName,
    url: BASE,
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
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: COMPANY.openingHours.open,
      closes: COMPANY.openingHours.close,
    },
  };
}

export function productJsonLd(product: Product, locale: string) {
  const name = product.name_de;
  const image = absoluteUrl(getProductImageUrl(product));
  const gtin = product.barcode?.replace(/\D/g, "") || "";
  const brandName = product.brand?.trim() || null;
  const mpn = product.mpn?.trim() || product.sku;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.sku,
    image,
    description: product.description_de || name,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productPath(locale === "tr" ? "tr" : "de", product.sku)),
      priceCurrency: "EUR",
      price: getB2cGross(product).toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.is_active && hasSellablePrice(product)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: COMPANY.legalName },
    },
  };

  if (brandName) {
    jsonLd.brand = { "@type": "Brand", name: brandName };
  }
  if (gtin.length >= 8) {
    jsonLd.gtin = gtin;
  }
  if (mpn) {
    jsonLd.mpn = mpn;
  }
  if (product.manufacturer?.trim()) {
    jsonLd.manufacturer = {
      "@type": "Organization",
      name: product.manufacturer.trim(),
    };
  }
  if (product.country_of_origin?.trim()) {
    jsonLd.countryOfOrigin = {
      "@type": "Country",
      name: product.country_of_origin.trim(),
    };
  }

  return jsonLd;
}
