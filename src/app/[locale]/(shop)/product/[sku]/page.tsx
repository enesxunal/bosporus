import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySku, getCategoryBySlug } from "@/lib/products";
import { ProductDetailView } from "@/components/b2c/ProductDetailView";
import { isPaymentTestSku } from "@/lib/payment-test-product";
import { productJsonLd, productMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

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

  const isTest = isPaymentTestSku(product.sku);
  const jsonLd = isTest ? null : productJsonLd(product, locale);

  const category = product.category_slug ? getCategoryBySlug(product.category_slug) : undefined;
  const breadcrumbItems = [
    { name: "Startseite", href: "/" },
    { name: "Produkte", href: "/products" },
    ...(category
      ? [{ name: category.name_de, href: `/products/${category.slug}` }]
      : []),
    { name: product.name_de.trim() },
  ];

  return (
    <>
      {!isTest && <Breadcrumbs items={breadcrumbItems} />}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailView product={product} />
    </>
  );
}
