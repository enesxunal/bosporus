import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySku } from "@/lib/products";
import { ProductDetailView } from "@/components/b2c/ProductDetailView";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sku: string }>;
}) {
  const { locale, sku } = await params;
  setRequestLocale(locale);

  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();

  return <ProductDetailView product={product} />;
}
