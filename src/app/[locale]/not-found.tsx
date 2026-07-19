import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="page-narrow py-20 sm:py-28 text-center">
      <p className="text-sm font-bold text-bosporus tracking-widest uppercase mb-2">404</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-3 tracking-tight">
        {t("title")}
      </h1>
      <p className="text-bosporus-muted mb-8 max-w-md mx-auto">{t("desc")}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-6 text-base font-bold rounded-xl bg-bosporus text-white hover:bg-bosporus-dark transition-colors"
        >
          {t("home")}
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center h-12 px-6 text-base font-bold rounded-xl border-2 border-bosporus/30 text-bosporus-gray-800 hover:bg-bosporus-light transition-colors"
        >
          {t("products")}
        </Link>
      </div>
    </div>
  );
}
