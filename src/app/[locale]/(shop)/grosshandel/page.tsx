import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  BadgePercent,
  ClipboardList,
  LayoutGrid,
  Truck,
  FileText,
  Search,
  Building2,
  ArrowRight,
} from "lucide-react";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/grosshandel", locale);
}

export default async function GrosshandelLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("grosshandel");

  const features = [
    { icon: BadgePercent, title: t("f1Title"), desc: t("f1Desc") },
    { icon: ClipboardList, title: t("f2Title"), desc: t("f2Desc") },
    { icon: LayoutGrid, title: t("f3Title"), desc: t("f3Desc") },
    { icon: Search, title: t("f4Title"), desc: t("f4Desc") },
    { icon: Truck, title: t("f5Title"), desc: t("f5Desc") },
    { icon: FileText, title: t("f6Title"), desc: t("f6Desc") },
  ] as const;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-metro-navy via-[#003a72] to-bosporus text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_20%_20%,#fff00033,transparent_50%),radial-gradient(ellipse_at_80%_80%,#1d71b855,transparent_45%)]" />
        <div className="page-container relative py-14 sm:py-20 md:py-24 max-w-3xl">
          <p className="text-bosporus-yellow font-bold tracking-[0.2em] text-xs sm:text-sm uppercase mb-4">
            Bosporus · Köln
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-base sm:text-xl text-white/85 max-w-xl mb-8 leading-relaxed">
            {t("heroDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 text-base font-bold rounded-xl bg-bosporus-yellow text-metro-navy hover:bg-yellow-300 active:scale-[0.98] transition-all"
            >
              {t("ctaRegister")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-7 text-base font-bold rounded-xl border-2 border-white/35 text-white hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              {t("ctaLogin")}
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/65 flex items-center gap-2">
            <Building2 className="w-4 h-4 shrink-0" />
            {t("heroNote")}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white">
        <div className="page-container">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight mb-2 text-center">
            {t("benefitsTitle")}
          </h2>
          <p className="text-bosporus-muted text-center max-w-xl mx-auto mb-10">{t("benefitsDesc")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="min-w-0">
                <div className="w-11 h-11 rounded-xl bg-bosporus-light text-bosporus flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-bosporus-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-bosporus-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-bosporus-gray-50 border-y border-bosporus-gray-100">
        <div className="page-container max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight mb-3">
            {t("howTitle")}
          </h2>
          <ol className="text-left space-y-4 mb-8 max-w-md mx-auto">
            {[t("how1"), t("how2"), t("how3")].map((step, i) => (
              <li key={step} className="flex gap-3 items-start">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-bosporus text-white font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-bosporus-gray-800 pt-1 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-bold rounded-xl bg-bosporus text-white hover:bg-bosporus-dark transition-colors"
          >
            {t("ctaRegister")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
