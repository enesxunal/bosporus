import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getCategories, getProducts, getPromoProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { ProductSearch } from "@/components/b2c/ProductSearch";
import { CategoryNav } from "@/components/b2c/CategoryNav";
import { isPromoActive } from "@/lib/pricing";

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

  const categories = getCategories();
  let products = getProducts({ search: q, limit: 48 });

  if (filter === "aktion") {
    products = getPromoProducts(48);
  }

  return (
    <>
      <CategoryNav categories={categories} locale={locale} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-bosporus-gray-800">
            {filter === "aktion"
              ? locale === "de"
                ? "Aktuelle Angebote"
                : "Güncel kampanyalar"
              : t("allProducts")}
          </h1>
          <div className="w-full sm:max-w-sm">
            <ProductSearch initialQuery={q} />
          </div>
        </div>
        {products.length === 0 ? (
          <p className="text-bosporus-muted py-12 text-center">{t("noResults")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variant={isPromoActive(p) ? "deal" : "default"}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
