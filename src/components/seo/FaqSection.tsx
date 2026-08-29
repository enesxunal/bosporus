import type { FaqItem } from "@/lib/seo";
import { faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

type FaqSectionProps = {
  title?: string;
  items: FaqItem[];
  className?: string;
  /** Render inside a parent layout (e.g. category SEO block) without extra section padding */
  embedded?: boolean;
};

export function FaqSection({
  title = "Häufige Fragen",
  items,
  className = "",
  embedded = false,
}: FaqSectionProps) {
  if (!items.length) return null;

  const content = (
    <>
      <JsonLd data={faqJsonLd(items)} />
      <h2
        className={
          embedded
            ? "text-base sm:text-lg font-extrabold text-bosporus-gray-800 mb-5"
            : "text-xl sm:text-2xl font-extrabold text-bosporus-gray-800 mb-6"
        }
      >
        {title}
      </h2>
      <dl className="space-y-5">
        {items.map((item) => (
          <div key={item.question} className="border-b border-bosporus-gray-100 pb-5 last:border-0">
            <dt className="font-bold text-bosporus-gray-800 mb-1.5">{item.question}</dt>
            <dd className="text-sm sm:text-base text-bosporus-muted leading-relaxed">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  if (embedded) {
    return <div className={`card p-6 sm:p-7 ${className}`}>{content}</div>;
  }

  return (
    <section className={`py-8 sm:py-10 ${className}`}>
      <div className="page-container max-w-3xl">{content}</div>
    </section>
  );
}
