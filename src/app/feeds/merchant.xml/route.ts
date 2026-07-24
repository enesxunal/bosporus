import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { getProductImageUrl } from "@/lib/category-images";
import { getB2cGross, hasSellablePrice, isPromoActive } from "@/lib/pricing";
import { getProducts } from "@/lib/products";
import { absoluteUrl, productPath } from "@/lib/seo";
import { B2B_ONLY_MODE } from "@/lib/shop-mode";

export const revalidate = 3600;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function merchantProductId(product: { id: string; sku: string }): string {
  // Google Merchant: g:id max 50 karakter. SKU’lar uzun olabiliyor → DB id / kısa hash.
  const raw = (product.id || product.sku).trim();
  if (raw.length > 0 && raw.length <= 50) return raw;
  // Stabil kısa id (SKU’dan)
  let hash = 0;
  for (let i = 0; i < product.sku.length; i++) {
    hash = (hash * 31 + product.sku.charCodeAt(i)) >>> 0;
  }
  const prefix = product.sku.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  return `${prefix}-${hash.toString(36)}`.slice(0, 50);
}

/** Google Merchant Center ürün feed (XML) — B2B-only modda fiyat yok, boş feed */
export async function GET() {
  if (B2B_ONLY_MODE) {
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(COMPANY.tradeName)}</title>
    <link>${xmlEscape(COMPANY.website)}</link>
    <description>B2B only – no public prices</description>
  </channel>
</rss>`;
    return new NextResponse(empty, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const products = await getProducts({ limit: 8000, activeOnly: true });
  const base = COMPANY.website.replace(/\/$/, "");

  const items = products
    .filter((p) => p.is_active && hasSellablePrice(p) && p.name_de && p.name_de !== "#")
    .map((p) => {
      const price = getB2cGross(p, isPromoActive(p));
      if (price <= 0) return null;
      const image = getProductImageUrl(p);
      const link = absoluteUrl(productPath("de", p.sku));
      const imageLink = absoluteUrl(image);
      const desc =
        (p.description_de || `${p.name_de} – Großhandel Köln | Bosporus`).slice(0, 5000);
      const availability = "in_stock";
      const brand = COMPANY.tradeName;
      const gtin = p.barcode?.replace(/\D/g, "") || "";
      const offerId = merchantProductId(p);
      const mpn = p.sku.slice(0, 70);

      return `
    <item>
      <g:id>${xmlEscape(offerId)}</g:id>
      <g:title>${cdata(p.name_de.slice(0, 150))}</g:title>
      <g:description>${cdata(desc)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(imageLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} EUR</g:price>
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>${gtin.length >= 8 ? "yes" : "no"}</g:identifier_exists>
      ${gtin.length >= 8 ? `<g:gtin>${xmlEscape(gtin)}</g:gtin>` : ""}
      <g:mpn>${xmlEscape(mpn)}</g:mpn>
      ${p.category_slug ? `<g:product_type>${cdata(p.category_slug)}</g:product_type>` : ""}
      <g:shipping>
        <g:country>DE</g:country>
        <g:service>Lieferung Köln</g:service>
        <g:price>30.00 EUR</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>1</g:max_handling_time>
        <g:min_transit_time>0</g:min_transit_time>
        <g:max_transit_time>1</g:max_transit_time>
      </g:shipping>
    </item>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bosporus Produktfeed</title>
    <link>${xmlEscape(base)}</link>
    <description>Bosporus GmbH – Großhandel Köln</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
