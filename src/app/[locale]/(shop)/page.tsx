import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeaturedCategories, getProducts, getPromoProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { PromoBanner } from "@/components/b2c/PromoBanner";
import { CategoryTile } from "@/components/b2c/CategoryTile";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");
  const categories = getFeaturedCategories(8);
  const featured = await getProducts({ limit: 8 });
  const promos = await getPromoProducts(8);

  return (
    <>
      <PromoBanner />

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
              href="/gewerbe"
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
