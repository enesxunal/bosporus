import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { shopPageMetadata } from "@/lib/page-seo";
import { RATGEBER_ARTICLES } from "@/lib/ratgeber";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/ratgeber", locale);
}

export default async function RatgeberHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <div className="bg-gradient-to-br from-bosporus to-bosporus-dark text-white">
        <div className="page-container py-10 sm:py-14">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ratgeber – Großhandel Köln
          </h1>
          <p className="text-white/85 max-w-2xl text-base sm:text-lg">
            Praxisnahe Informationen zu Lebensmittel- und Getränke-Großhandel für Gastronomie,
            Imbiss, Kiosk und Wiederverkäufer – von Bosporus GmbH in Köln-Ossendorf.
          </p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
          {RATGEBER_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/ratgeber/${article.slug}`}
              className="block rounded-2xl border border-bosporus-gray-100 bg-white p-5 hover:border-bosporus/30 hover:shadow-sm transition-all"
            >
              <h2 className="font-bold text-bosporus-gray-800 mb-2">{article.h1}</h2>
              <p className="text-sm text-bosporus-muted leading-relaxed line-clamp-3">{article.intro}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
