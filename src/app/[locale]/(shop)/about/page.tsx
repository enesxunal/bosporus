import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Truck, Shield, Users, MapPin, Store, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/about", locale);
}

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

  const categoryLinks = [
    { slug: "lebensmittel", label: "Lebensmittel" },
    { slug: "getraenke", label: "Getränke" },
    { slug: "tk-tiefkuehl", label: "Tiefkühl" },
    { slug: "gewuerze", label: "Gewürze" },
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
          <p className="text-lg text-bosporus-gray-800 leading-relaxed font-medium mb-4">
            Bosporus GmbH ist ein Lebensmittel- und Getränke-Großhandel mit Standort in Köln-Ossendorf –
            mit langjähriger Erfahrung in der Belieferung von Gastronomie und Gewerbe.
          </p>
          <p className="text-bosporus-muted leading-relaxed">{t("story")}</p>
          <p className="text-bosporus-muted leading-relaxed mt-4">
            Unser Online-Shop richtet sich an Gewerbekunden – Registrierung mit USt-IdNr., Freigabe und
            Bestellung ab 500 € Mindestbestellwert. An unserem Standort in Köln-Ossendorf können jedoch
            auch Privatkunden direkt vor Ort einkaufen. Parkplätze stehen vor Ort zur Verfügung.
          </p>
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
            <Store className="w-8 h-8 text-bosporus mx-auto mb-2" />
            <p className="text-lg font-extrabold text-bosporus">Vor Ort</p>
            <p className="text-sm text-bosporus-muted mt-2">Einkauf vor Ort auch für Privatkunden möglich</p>
          </div>
          <div className="bg-bosporus-light rounded-2xl p-6 text-center border border-bosporus/10">
            <Building2 className="w-8 h-8 text-bosporus mx-auto mb-2" />
            <p className="text-lg font-extrabold text-bosporus">Online-Shop</p>
            <p className="text-sm text-bosporus-muted mt-2">Nur für freigeschaltete Gewerbekunden</p>
          </div>
          <div className="bg-bosporus-light rounded-2xl p-6 text-center border border-bosporus/10">
            <MapPin className="w-8 h-8 text-bosporus mx-auto mb-2" />
            <p className="text-lg font-extrabold text-bosporus">Köln-Ossendorf</p>
            <p className="text-sm text-bosporus-muted mt-2">{companyAddressLine()}</p>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-extrabold text-metro-navy mb-3">Sortiment</h2>
          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products/${cat.slug}`}
                className="inline-flex px-3 py-1.5 text-sm font-medium rounded-lg bg-bosporus-light text-bosporus hover:bg-bosporus/10"
              >
                {cat.label}
              </Link>
            ))}
            <Link href="/products" className="inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border border-bosporus/20 text-bosporus-gray-800 hover:bg-bosporus-light">
              Alle Kategorien
            </Link>
          </div>
        </section>

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
