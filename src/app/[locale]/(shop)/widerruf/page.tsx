import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { COMPANY, companyAddressLine } from "@/lib/company";

export default async function WiderrufPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const de = locale !== "tr";
  const t = await getTranslations("legal");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">{t("widerrufTitle")}</h1>
      <div className="space-y-6 text-sm text-bosporus-gray-800 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">{de ? "Widerrufsrecht" : "Cayma hakkı"}</h2>
          <p>
            {de
              ? "Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen den Vertrag zu widerrufen. Bei verderblichen Lebensmitteln kann das Widerrufsrecht eingeschränkt sein."
              : "Tüketiciler 14 gün içinde sebep belirtmeden sözleşmeden cayabilir. Bozulabilir gıdalarda cayma hakkı sınırlı olabilir."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">{de ? "Rücksendung" : "İade"}</h2>
          <p>
            {de
              ? "Bitte kontaktieren Sie uns vor einer Rücksendung. Unversehrte, handelsübliche Ware kann nach Absprache zurückgegeben werden."
              : "İade öncesi lütfen bizimle iletişime geçin. Hasarsız ve satılabilir ürünler karşılıklı anlaşmayla iade edilebilir."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">{de ? "Stornierung" : "İptal"}</h2>
          <p>
            {de
              ? "Bestellungen können vor Beginn der Zubereitung kostenfrei storniert werden. Kontaktieren Sie uns schnellstmöglich per E-Mail oder Telefon."
              : "Hazırlık başlamadan önce siparişler ücretsiz iptal edilebilir. Lütfen en kısa sürede e-posta veya telefon ile bize ulaşın."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">{de ? "Kontakt" : "İletişim"}</h2>
          <p>
            {COMPANY.legalName}<br />
            {companyAddressLine()}<br />
            E-Mail: {COMPANY.email}<br />
            Tel: {COMPANY.phone}
          </p>
          <p className="mt-3">
            <Link href="/contact" className="text-bosporus font-semibold hover:underline">
              {de ? "Kontaktformular →" : "İletişim formu →"}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
