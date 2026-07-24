import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/", locale);
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeaturedCategoriesAsync, getProducts, getPromoProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { PromoBanner } from "@/components/b2c/PromoBanner";
import { CategoryTile } from "@/components/b2c/CategoryTile";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const revalidate = 120;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");
  const [categories, featured, promos] = await Promise.all([
    getFeaturedCategoriesAsync(8),
    getProducts({ limit: 8 }),
    getPromoProducts(8),
  ]);

  return (
    <>
      <PromoBanner />

      <section className="py-8 sm:py-10 bg-white border-b border-bosporus-gray-100">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight mb-2">
              {home("whyTitle")}
            </h2>
            <p className="text-bosporus font-semibold text-base sm:text-lg">
              {home("firstOrderFreeTitle")}
            </p>
            <p className="text-bosporus-muted text-sm sm:text-base mt-1">{home("firstOrderFreeDesc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {(
              [
                { title: home("delivery"), desc: home("deliveryDesc") },
                { title: home("quality"), desc: home("qualityDesc") },
                { title: home("service"), desc: home("serviceDesc") },
                { title: home("fresh"), desc: home("freshDesc") },
              ] as const
            ).map((item) => (
              <div key={item.title} className="text-center sm:text-left">
                <h3 className="font-bold text-bosporus-gray-800 mb-1.5">{item.title}</h3>
                <p className="text-sm text-bosporus-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-11 px-5 text-sm font-bold rounded-xl bg-bosporus-yellow text-bosporus-gray-800 hover:bg-bosporus-yellow-dark transition-colors"
            >
              {home("firstOrderCta")}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center h-11 px-5 text-sm font-bold rounded-xl border-2 border-bosporus/25 text-bosporus-gray-800 hover:bg-bosporus-light transition-colors"
            >
              {home("popularAction")}
            </Link>
          </div>
        </div>
      </section>

      {promos.length > 0 && (
        <section className="py-8 sm:py-10 bg-white">
          <div className="page-container">
            <SectionHeader
              eyebrow={home("promoEyebrow")}
              title={home("promoTitle")}
              action={{
                label: home("promoAction"),
                href: "/products?filter=aktion",
              }}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {promos.map((p) => (
                <ProductCard key={p.id} product={p} variant="deal" />
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="py-8 sm:py-10">
          <div className="page-container">
            <SectionHeader title={home("categoriesTitle")} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <CategoryTile key={cat.slug} category={cat} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-10 bg-white">
        <div className="page-container">
          <SectionHeader
            title={home("popularTitle")}
            action={{
              label: home("popularAction"),
              href: "/products",
            }}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gradient-to-br from-bosporus to-bosporus-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
        <div className="page-container relative text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight">{home("ctaTitle")}</h2>
          <p className="text-white/90 mb-8 text-base sm:text-lg">{home("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-12 px-6 text-base font-bold rounded-xl bg-bosporus-yellow text-bosporus-gray-800 hover:bg-bosporus-yellow-dark active:scale-[0.98] transition-all"
            >
              {home("b2bPortal")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-6 text-base font-bold rounded-xl border-2 border-white/40 text-white hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              {home("ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
