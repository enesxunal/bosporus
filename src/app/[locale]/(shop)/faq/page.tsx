import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/faq", locale);
}

import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const legal = await getTranslations("legal");

  const items = [1, 2, 3, 4, 5] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">{legal("faqTitle")}</h1>
      <div className="space-y-4">
        {items.map((i) => (
          <details
            key={i}
            className="bg-white rounded-2xl border border-bosporus-gray-200 overflow-hidden group"
          >
            <summary className="px-5 py-4 font-semibold text-bosporus-gray-800 cursor-pointer list-none flex justify-between items-center gap-4 hover:bg-bosporus-gray-50">
              {t(`q${i}`)}
              <span className="text-bosporus text-xl leading-none group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-5 pb-4 text-sm text-bosporus-muted leading-relaxed border-t border-bosporus-gray-100 pt-3">
              {t(`a${i}`)}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
