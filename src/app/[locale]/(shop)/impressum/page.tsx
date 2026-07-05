import { setRequestLocale } from "next-intl/server";
import { COMPANY, companyAddressLine } from "@/lib/company";

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const de = locale !== "tr";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">
        {de ? "Impressum" : "Künye"}
      </h1>

      <section className="space-y-6 text-bosporus-gray-800">
        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Angaben gemäß § 5 TMG" : "Yasal bilgiler (§ 5 TMG)"}
          </h2>
          <p>
            {COMPANY.legalName}<br />
            {COMPANY.street}<br />
            {COMPANY.zip} {COMPANY.city}<br />
            {COMPANY.country}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">{de ? "Kontakt" : "İletişim"}</h2>
          <p>
            {de ? "Telefon" : "Telefon"}: {COMPANY.phone}<br />
            E-Mail: {COMPANY.email}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Registereintrag" : "Ticaret sicili"}
          </h2>
          <p>
            {de ? "Registergericht" : "Sicil mahkemesi"}: {COMPANY.registerCourt}<br />
            {de ? "Registernummer" : "Sicil no"}: {COMPANY.registerNumber}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Umsatzsteuer" : "Vergi bilgileri"}
          </h2>
          <p>
            {de ? "Steuernummer" : "Vergi no"}: {COMPANY.taxNumber}<br />
            USt-IdNr.: {COMPANY.vatId}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Verantwortlich für den Inhalt" : "İçerik sorumlusu"}
          </h2>
          <p>{COMPANY.legalName}, {companyAddressLine()}</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">EU-Streitschlichtung</h2>
          <p className="text-sm text-bosporus-muted">
            {de
              ? "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr"
              : "Avrupa Komisyonu çevrimiçi uyuşmazlık çözümü platformu: https://ec.europa.eu/consumers/odr"}
          </p>
        </div>
      </section>
    </div>
  );
}
