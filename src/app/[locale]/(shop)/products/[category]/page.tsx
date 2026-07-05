import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/products";
import { ProductGrid } from "@/components/b2c/ProductGrid";
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

  const name = locale === "tr" && category.name_tr ? category.name_tr : category.name_de;

  return (
    <>
      <div className="relative h-40 md:h-52 overflow-hidden">
        <Image src={getCategoryImageUrl(slug)} alt={name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-metro-navy/90 to-metro-navy/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-6 w-full">
            <h1 className="text-3xl font-bold text-white">{name}</h1>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ProductGrid category={slug} />
      </div>
    </>
  );
}
