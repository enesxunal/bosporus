import { Link } from "@/i18n/navigation";
import type { CategorySeoContent } from "@/lib/category-seo";
import { getCategoryBySlug } from "@/lib/products";
import { FaqSection } from "@/components/seo/FaqSection";

export function CategorySeoContent({ seo }: { seo: CategorySeoContent }) {
  const related = seo.relatedSlugs
    .map((slug) => getCategoryBySlug(slug))
    .filter(Boolean);

  return (
    <div className="page-container pb-8 space-y-8">
      <div className="max-w-3xl">
        <p className="text-base sm:text-lg text-bosporus-gray-800 leading-relaxed">{seo.intro}</p>
        {seo.sections.map((section) => (
          <div key={section.heading} className="mt-6">
            <h2 className="text-lg font-bold text-bosporus-gray-800 mb-2">{section.heading}</h2>
            <p className="text-sm sm:text-base text-bosporus-muted leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-bosporus-gray-800 mb-3">Verwandte Kategorien</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((cat) => (
              <Link
                key={cat!.slug}
                href={`/products/${cat!.slug}`}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-bosporus-light text-bosporus hover:bg-bosporus/10 transition-colors"
              >
                {cat!.name_de}
              </Link>
            ))}
          </div>
        </div>
      )}

      {seo.faq.length > 0 && (
        <FaqSection title="Fragen zu dieser Kategorie" items={seo.faq} className="!py-0" />
      )}
    </div>
  );
}
