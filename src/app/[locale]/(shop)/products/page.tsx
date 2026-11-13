import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/products", locale);
}

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ProductGrid } from "@/components/b2c/ProductGrid";
import { ProductSearch } from "@/components/b2c/ProductSearch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getProductCount, getProducts, hasActivePromos } from "@/lib/products";
import type { Product } from "@/lib/types";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { locale } = await params;
  const { q, filter } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("product");

  if (filter === "aktion") {
    const active = await hasActivePromos();
    if (!active) {
      redirect({ href: "/products", locale });
    }
  }

  // Give crawlers (and non-JS users) visible product links in the HTML,
  // without changing the interactive filters or load-more behavior.
  let initialProducts: Product[] | undefined;
  let initialTotal: number | undefined;
  if (!q && !filter) {
    [initialProducts, initialTotal] = await Promise.all([
      getProducts({ limit: 48 }),
      getProductCount(),
    ]);
  }

  const title =
    filter === "aktion"
      ? locale === "de"
        ? "Aktuelle Angebote"
        : "Güncel kampanyalar"
      : q
        ? `"${q}"`
        : t("allProducts");

  return (
    <>
      <div className="page-container py-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-6">
          <SectionHeader title={title} />
          <div className="w-full sm:max-w-md">
            <ProductSearch initialQuery={q} />
          </div>
        </div>
        <ProductGrid
          key={(q ?? "") + ":" + (filter ?? "")}
          search={q}
          filter={filter}
          initialProducts={initialProducts}
          initialTotal={initialTotal}
        />
      </div>
    </>
  );
}
