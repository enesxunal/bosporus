import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6">{t("title")}</h1>
      <Card className="!rounded-2xl space-y-4">
        <p className="text-bosporus-gray-800 leading-relaxed">{t("intro")}</p>
        <p className="text-bosporus-muted leading-relaxed">{t("story")}</p>
        <div className="grid sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-bosporus-light rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-bosporus">B2C</p>
            <p className="text-sm text-bosporus-muted mt-1">{t("b2c")}</p>
          </div>
          <div className="bg-bosporus-light rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-bosporus">B2B</p>
            <p className="text-sm text-bosporus-muted mt-1">{t("b2b")}</p>
          </div>
          <div className="bg-bosporus-light rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-bosporus">Köln</p>
            <p className="text-sm text-bosporus-muted mt-1">{t("location")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
