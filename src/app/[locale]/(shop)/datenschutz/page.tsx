import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { COMPANY } from "@/lib/company";

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const de = locale !== "tr";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">
        {de ? "Datenschutzerklärung" : "Gizlilik Politikası"}
      </h1>

      <div className="space-y-6 text-sm text-bosporus-gray-800 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. {de ? "Verantwortlicher" : "Veri sorumlusu"}</h2>
          <p>
            {COMPANY.legalName}<br />
            {COMPANY.street}, {COMPANY.zip} {COMPANY.city}<br />
            E-Mail: {COMPANY.email}<br />
            {de ? "Telefon" : "Telefon"}: {COMPANY.phone}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            2. {de ? "Erhebung und Speicherung personenbezogener Daten" : "Kişisel verilerin toplanması"}
          </h2>
          <p>
            {de
              ? "Beim Besuch unserer Website werden technisch notwendige Daten (IP-Adresse, Browsertyp, Zeitpunkt) automatisch erfasst. Bei Registrierung und Bestellung speichern wir Name, E-Mail-Adresse, Lieferadresse und Bestelldaten."
              : "Web sitemizi ziyaret ettiğinizde teknik veriler (IP adresi, tarayıcı türü, zaman) otomatik kaydedilir. Kayıt ve sipariş sırasında ad, e-posta, teslimat adresi ve sipariş bilgileri saklanır."}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            3. {de ? "Zweck der Datenverarbeitung" : "Veri işleme amacı"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{de ? "Abwicklung von Bestellungen und Lieferungen" : "Sipariş ve teslimat işlemleri"}</li>
            <li>{de ? "Kundenkonto und Bestellhistorie" : "Müşteri hesabı ve sipariş geçmişi"}</li>
            <li>{de ? "Kommunikation mit Kunden" : "Müşteri iletişimi"}</li>
            <li>{de ? "Erfüllung gesetzlicher Pflichten" : "Yasal yükümlülükler"}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            4. {de ? "Rechtsgrundlage" : "Hukuki dayanak"}
          </h2>
          <p>
            {de
              ? "Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), lit. a DSGVO (Einwilligung) und lit. f DSGVO (berechtigtes Interesse)."
              : "GDPR Madde 6/1-b (sözleşme), 6/1-a (onay) ve 6/1-f (meşru menfaat)."}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            5. {de ? "Speicherdauer" : "Saklama süresi"}
          </h2>
          <p>
            {de
              ? "Bestelldaten werden gemäß handels- und steuerrechtlichen Vorgaben bis zu 10 Jahre aufbewahrt. Kontodaten bis zur Löschung des Kontos."
              : "Sipariş verileri ticaret ve vergi mevzuatına göre 10 yıla kadar saklanır. Hesap verileri hesap silinene kadar tutulur."}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            6. {de ? "Ihre Rechte" : "Haklarınız"}
          </h2>
          <p>
            {de
              ? "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Kontakt: info@bosporus-gmbh.com"
              : "Bilgi alma, düzeltme, silme, işlemeyi kısıtlama, veri taşınabilirliği ve itiraz hakkınız vardır. İletişim: info@bosporus-gmbh.com"}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Cookies</h2>
          <p>
            {de
              ? "Wir verwenden technisch notwendige Cookies für die Anmeldung und den Warenkorb. Ohne diese Cookies ist die Nutzung des Shops eingeschränkt."
              : "Giriş ve sepet için teknik olarak gerekli çerezler kullanılır. Bu çerezler olmadan mağaza kullanımı kısıtlıdır."}
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">
            8. {de ? "Hosting" : "Barındırma"}
          </h2>
          <p>
            {de
              ? "Diese Website wird bei Vercel Inc. (USA) gehostet. Datenbankdienste über Supabase. Es können Daten in Drittländer übertragen werden; geeignete Garantien (Standardvertragsklauseln) werden eingesetzt."
              : "Site Vercel Inc. (ABD) üzerinde barındırılır. Veritabanı Supabase ile sağlanır. Veriler üçüncü ülkelere aktarılabilir; uygun güvenceler (standart sözleşme maddeleri) kullanılır."}
          </p>
        </section>

        <p className="text-bosporus-muted pt-4">
          <Link href="/impressum" className="text-bosporus hover:underline">
            {de ? "Impressum" : "Künye"}
          </Link>
          {" · "}
          <Link href="/contact" className="text-bosporus hover:underline">
            {de ? "Kontakt" : "İletişim"}
          </Link>
        </p>
      </div>
    </div>
  );
}
