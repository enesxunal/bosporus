import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts, getProductCount } from "@/lib/products";
import { ProductGrid } from "@/components/b2c/ProductGrid";
import Image from "next/image";
import { getCategoryBannerUrl } from "@/lib/category-images";
import { categoryMetadata } from "@/lib/seo";
import { getCategorySeo } from "@/lib/category-seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CategorySeoContent } from "@/components/seo/CategorySeoContent";
import { RATGEBER_ARTICLES } from "@/lib/ratgeber";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Kategorie" };
  return categoryMetadata(category, locale, getCategoryBannerUrl(slug));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const seo = getCategorySeo(category);
  const relatedGuides = RATGEBER_ARTICLES.filter((article) =>
    article.relatedCategorySlugs.includes(slug)
  ).slice(0, 4);
  const banner = getCategoryBannerUrl(slug);
  const [initialProducts, initialTotal] = await Promise.all([
    getProducts({ category: slug, limit: 48 }),
    getProductCount(slug),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Startseite", href: "/" },
          { name: "Produkte", href: "/products" },
          { name: seo.h1 },
        ]}
      />
      <div className="relative h-40 md:h-52 overflow-hidden">
        <Image src={banner} alt={seo.h1} fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-metro-navy/90 to-metro-navy/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-6 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{seo.h1}</h1>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <ProductGrid
          key={slug}
          category={slug}
          initialProducts={initialProducts}
          initialTotal={initialTotal}
        />
      </div>
      <CategorySeoContent seo={seo} />
      {relatedGuides.length > 0 && (
        <section aria-label="Passende Einkaufsratgeber" className="bg-white border-t border-bosporus-gray-100">
          <div className="page-container py-8 sm:py-10">
            <h2 className="text-xl font-extrabold text-bosporus-gray-800 mb-4">
              Passende Einkaufsratgeber
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedGuides.map((article) => (
                <Link
                  key={article.slug}
                  href={`/ratgeber/${article.slug}`}
                  className="rounded-xl border border-bosporus-gray-100 p-4 hover:border-bosporus/40 transition-colors"
                >
                  <h3 className="font-semibold text-bosporus-gray-800">{article.h1}</h3>
                  <p className="text-sm text-bosporus-muted mt-1">{article.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
