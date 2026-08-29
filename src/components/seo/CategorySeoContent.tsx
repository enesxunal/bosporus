import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { CategorySeoContent } from "@/lib/category-seo";
import { getCategoryBySlug } from "@/lib/products";
import { FaqSection } from "@/components/seo/FaqSection";

export function CategorySeoContent({ seo }: { seo: CategorySeoContent }) {
  const related = seo.relatedSlugs
    .map((slug) => getCategoryBySlug(slug))
    .filter(Boolean);

  return (
    <section
      aria-label="Kategorieinformationen"
      className="border-t border-bosporus-gray-200 bg-bosporus-gray-50"
    >
      <div className="page-container py-10 sm:py-14 space-y-8 sm:space-y-10">
        <p className="max-w-3xl text-lg sm:text-xl text-bosporus-gray-800 leading-relaxed font-medium">
          {seo.intro}
        </p>

        {seo.sections.length > 0 && (
          <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
            {seo.sections.map((section) => (
              <article key={section.heading} className="card p-6 sm:p-7">
                <h2 className="text-base sm:text-lg font-extrabold text-bosporus-gray-800 mb-3">
                  {section.heading}
                </h2>
                <p className="text-sm sm:text-base text-bosporus-muted leading-relaxed">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="card p-6 sm:p-7">
            <h2 className="text-base sm:text-lg font-extrabold text-bosporus-gray-800 mb-4">
              Verwandte Kategorien
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {related.map((cat) => (
                <Link
                  key={cat!.slug}
                  href={`/products/${cat!.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-bosporus-light text-bosporus hover:bg-bosporus/10 transition-colors"
                >
                  {cat!.name_de}
                  <ArrowRight className="w-3.5 h-3.5 opacity-70" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        )}

        {seo.faq.length > 0 && (
          <FaqSection
            title="Fragen zu dieser Kategorie"
            items={seo.faq}
            embedded
          />
        )}
      </div>
    </section>
  );
}
