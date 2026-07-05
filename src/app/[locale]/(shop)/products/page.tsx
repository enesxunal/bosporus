import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/b2c/ProductGrid";
import { ProductSearch } from "@/components/b2c/ProductSearch";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
        <ProductGrid search={q} filter={filter} />
      </div>
    </>
  );
}
