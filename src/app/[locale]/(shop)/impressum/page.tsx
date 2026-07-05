import { setRequestLocale } from "next-intl/server";

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
            Bosporus GmbH<br />
            Von Hünefeld Straße 2<br />
            50829 Köln<br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">{de ? "Kontakt" : "İletişim"}</h2>
          <p>
            {de ? "Telefon" : "Telefon"}: +49 221 34098290<br />
            E-Mail: info@bosporus-gmbh.com
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Vertreten durch" : "Temsil eden"}
          </h2>
          <p>{de ? "Geschäftsführung Bosporus GmbH" : "Bosporus GmbH Yönetimi"}</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Registereintrag" : "Ticaret sicili"}
          </h2>
          <p>
            {de
              ? "Eingetragen im Handelsregister. Registergericht: Amtsgericht Köln."
              : "Köln Ticaret Sicili'ne kayıtlıdır (Amtsgericht Köln)."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Umsatzsteuer-ID" : "KDV numarası"}
          </h2>
          <p>
            {de
              ? "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: auf Anfrage"
              : "§ 27a UStG uyarınca KDV kimlik numarası: talep üzerine"}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">
            {de ? "Verantwortlich für den Inhalt" : "İçerik sorumlusu"}
          </h2>
          <p>Bosporus GmbH, Von Hünefeld Straße 2, 50829 Köln</p>
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
