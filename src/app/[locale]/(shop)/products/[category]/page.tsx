import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { CategoryNav } from "@/components/b2c/CategoryNav";
import { isPromoActive } from "@/lib/pricing";
import Image from "next/image";
import { getCategoryImageUrl } from "@/lib/category-images";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categories = getCategories();
  const products = await getProducts({ category: slug, limit: 100 });
  const name = locale === "tr" && category.name_tr ? category.name_tr : category.name_de;

  return (
    <>
      <CategoryNav categories={categories} locale={locale} activeSlug={slug} />
      <div className="relative h-40 md:h-52 overflow-hidden">
        <Image src={getCategoryImageUrl(slug)} alt={name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-metro-navy/90 to-metro-navy/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-6 w-full">
            <h1 className="text-3xl font-bold text-white">{name}</h1>
            <p className="text-white/80 text-sm mt-1">
              {products.length} {locale === "de" ? "Artikel" : "ürün"}
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} variant={isPromoActive(p) ? "deal" : "default"} />
          ))}
        </div>
      </div>
    </>
  );
}
