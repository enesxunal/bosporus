import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getCategories, getProducts, getPromoProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { ProductSearch } from "@/components/b2c/ProductSearch";
import { CategoryNav } from "@/components/b2c/CategoryNav";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
  let products = await getProducts({ search: q, limit: 48 });

  if (filter === "aktion") {
    products = await getPromoProducts(48);
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
      <CategoryNav categories={categories} locale={locale} />
      <div className="page-container py-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-6">
          <SectionHeader title={title} />
          <div className="w-full sm:max-w-md">
            <ProductSearch initialQuery={q} />
          </div>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-bosporus-muted text-lg">{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
