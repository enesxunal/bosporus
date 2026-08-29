import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getRatgeberArticle } from "@/lib/ratgeber";
import { getCategoryBySlug, getProductBySku } from "@/lib/products";
import { ratgeberMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getRatgeberArticle(slug);
  if (!article) return { title: "Ratgeber" };
  return ratgeberMetadata(article.title, article.description, slug, locale);
}

export default async function RatgeberArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getRatgeberArticle(slug);
  if (!article) notFound();

  const relatedCategories = article.relatedCategorySlugs
    .map((s) => getCategoryBySlug(s))
    .filter(Boolean);

  const relatedProducts = (
    await Promise.all(article.relatedProductSkus.map((sku) => getProductBySku(sku)))
  ).filter(Boolean);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Startseite", href: "/" },
          { name: "Ratgeber", href: "/ratgeber" },
          { name: article.h1 },
        ]}
      />

      <article className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-4 tracking-tight">
          {article.h1}
        </h1>
        <p className="text-base sm:text-lg text-bosporus-muted leading-relaxed mb-8">{article.intro}</p>

        <nav className="mb-8 rounded-xl bg-bosporus-light/60 border border-bosporus/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-bosporus-muted mb-2">Inhalt</p>
          <ul className="space-y-1 text-sm">
            {article.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-bosporus hover:underline font-medium">
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {article.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-8">
            <h2 className="text-xl font-bold text-bosporus-gray-800 mb-3">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-bosporus-muted leading-relaxed mb-3 last:mb-0">
                {p}
              </p>
            ))}
          </section>
        ))}

        {relatedCategories.length > 0 && (
          <section className="mb-8 pt-6 border-t border-bosporus-gray-100">
            <h2 className="text-lg font-bold text-bosporus-gray-800 mb-3">Passende Kategorien</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat!.slug}
                  href={`/products/${cat!.slug}`}
                  className="inline-flex px-3 py-1.5 text-sm font-medium rounded-lg bg-bosporus-light text-bosporus hover:bg-bosporus/10"
                >
                  {cat!.name_de}
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-bosporus-gray-800 mb-3">Beispielprodukte</h2>
            <ul className="space-y-2 text-sm">
              {relatedProducts.map((p) => (
                <li key={p!.sku}>
                  <Link href={`/product/${encodeURIComponent(p!.sku)}`} className="text-bosporus hover:underline font-medium">
                    {p!.name_de.trim()}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-bosporus-gray-100">
          <Link
            href="/register"
            className="inline-flex h-10 items-center px-4 text-sm font-bold rounded-xl bg-bosporus-yellow text-bosporus-gray-800 hover:bg-bosporus-yellow-dark"
          >
            Gewerbekonto eröffnen
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center px-4 text-sm font-bold rounded-xl border-2 border-bosporus/25 text-bosporus-gray-800 hover:bg-bosporus-light"
          >
            Kontakt
          </Link>
        </div>
      </article>

      {article.faq.length > 0 && <FaqSection items={article.faq} />}
    </>
  );
}
