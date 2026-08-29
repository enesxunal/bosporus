import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/products";
import { ProductGrid } from "@/components/b2c/ProductGrid";
import Image from "next/image";
import { getCategoryBannerUrl } from "@/lib/category-images";
import { categoryMetadata } from "@/lib/seo";
import { getCategorySeo } from "@/lib/category-seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CategorySeoContent } from "@/components/seo/CategorySeoContent";

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
  const banner = getCategoryBannerUrl(slug);
  const t = await getTranslations("product");

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
      <CategorySeoContent seo={seo} />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <p className="mb-5 rounded-xl bg-bosporus-light border border-bosporus/15 px-4 py-2.5 text-sm text-bosporus-gray-800/90">
          {t("listB2bOnly")}
        </p>
        <ProductGrid category={slug} />
      </div>
    </>
  );
}
