import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeaturedCategories, getProducts, getPromoProducts } from "@/lib/products";
import { ProductCard } from "@/components/b2c/ProductCard";
import { PromoBanner } from "@/components/b2c/PromoBanner";
import { CategoryTile } from "@/components/b2c/CategoryTile";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");
  const categories = getFeaturedCategories(8);
  const featured = getProducts({ limit: 8 });
  const promos = getPromoProducts(8);

  return (
    <>
      <PromoBanner />

      {/* Weekly deals — Lidl grid */}
      {promos.length > 0 && (
        <section className="py-8 bg-white border-b border-bosporus-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase text-bosporus-red tracking-wider">
                  {locale === "de" ? "Diese Woche" : "Bu hafta"}
                </span>
                <h2 className="text-2xl font-bold text-bosporus-gray-800">
                  {locale === "de" ? "Top-Angebote – lohnt sich" : "Kaçırılmayacak fırsatlar"}
                </h2>
              </div>
              <Link href="/products?filter=aktion" className="text-sm font-bold text-bosporus hover:underline">
                {locale === "de" ? "Alle Angebote →" : "Tüm kampanyalar →"}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
              {promos.map((p) => (
                <ProductCard key={p.id} product={p} variant="deal" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories with photos */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-bosporus-gray-800 mb-6">{home("categoriesTitle")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categories.map((cat) => (
              <CategoryTile key={cat.slug} category={cat} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-10 bg-bosporus-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-bosporus-gray-800 mb-6">
            {locale === "de" ? "Beliebte Produkte" : "Popüler ürünler"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-12 bg-bosporus text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{home("ctaTitle")}</h2>
          <p className="text-white/90 mb-8 text-lg">{home("ctaDesc")}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/gewerbe" className="px-8 py-3 bg-bosporus-yellow text-bosporus-gray-800 font-bold rounded-sm hover:bg-bosporus-yellow-dark transition-colors">
              {locale === "de" ? "Gewerbe-Portal" : "Kurumsal Portal"}
            </Link>
            <Link href="/contact" className="px-8 py-3 border-2 border-white font-bold rounded-sm hover:bg-white/10 transition-colors">
              {home("ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
