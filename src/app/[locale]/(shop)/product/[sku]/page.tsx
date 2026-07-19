import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySku } from "@/lib/products";
import { ProductDetailView } from "@/components/b2c/ProductDetailView";
import { productJsonLd, productMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; sku: string }>;
}): Promise<Metadata> {
  const { locale, sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return { title: "Produkt" };
  return productMetadata(product, locale);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sku: string }>;
}) {
  const { locale, sku } = await params;
  setRequestLocale(locale);

  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();

  const jsonLd = productJsonLd(product, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />
    </>
  );
}
