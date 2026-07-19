import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/about", locale);
}

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Truck, Shield, Users, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMPANY, companyAddressLine } from "@/lib/company";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const home = await getTranslations("home");

  const values = [
    { icon: Truck, title: home("delivery"), desc: home("deliveryDesc") },
    { icon: Shield, title: home("quality"), desc: home("qualityDesc") },
    { icon: Users, title: home("service"), desc: home("serviceDesc") },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-metro-navy to-bosporus-dark text-white">
        <div className="page-container py-10 sm:py-16">
          <p className="text-bosporus-yellow text-sm font-bold uppercase tracking-wide mb-2">{COMPANY.tradeName}</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">{t("title")}</h1>
          <p className="text-white/85 max-w-2xl text-base sm:text-lg">{t("subtitle")}</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 space-y-10">
        <Card className="!rounded-2xl">
          <p className="text-lg text-bosporus-gray-800 leading-relaxed font-medium mb-4">{t("intro")}</p>
          <p className="text-bosporus-muted leading-relaxed">{t("story")}</p>
          <div className="flex items-start gap-3 mt-6 pt-6 border-t border-bosporus-gray-100 text-sm text-bosporus-muted">
            <MapPin className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-bosporus-gray-800">{COMPANY.legalName}</p>
              <p>{companyAddressLine()} · {COMPANY.country}</p>
            </div>
          </div>
        </Card>

        <section>
          <h2 className="text-xl font-extrabold text-metro-navy mb-5">{t("valuesTitle")}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {values.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="!rounded-2xl text-center sm:text-left">
                <div className="w-12 h-12 bg-bosporus-light rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-3">
                  <Icon className="w-6 h-6 text-bosporus" />
                </div>
                <h3 className="font-bold text-bosporus-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-bosporus-muted leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-bosporus-light rounded-2xl p-6 text-center border border-bosporus/10">
            <p className="text-3xl font-extrabold text-bosporus">B2C</p>
            <p className="text-sm text-bosporus-muted mt-2">{t("b2c")}</p>
          </div>
          <div className="bg-bosporus-light rounded-2xl p-6 text-center border border-bosporus/10">
            <p className="text-3xl font-extrabold text-bosporus">B2B</p>
            <p className="text-sm text-bosporus-muted mt-2">{t("b2b")}</p>
          </div>
          <div className="bg-bosporus-light rounded-2xl p-6 text-center border border-bosporus/10">
            <p className="text-3xl font-extrabold text-bosporus">Köln</p>
            <p className="text-sm text-bosporus-muted mt-2">{t("location")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/contact">
            <Button size="lg">{t("ctaContact")}</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="lg">{t("ctaShop")}</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
