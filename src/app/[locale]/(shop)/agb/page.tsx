import { setRequestLocale, getTranslations } from "next-intl/server";
import { COMPANY, companyAddressLine } from "@/lib/company";

export default async function AgbPage({
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
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">{t("agbTitle")}</h1>
      <div className="space-y-6 text-sm text-bosporus-gray-800 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. {de ? "Geltungsbereich" : "Kapsam"}</h2>
          <p>
            {de
              ? `Diese AGB gelten für alle Bestellungen über ${COMPANY.website} und im Geschäft von ${COMPANY.legalName}, ${companyAddressLine()}.`
              : `Bu şartlar ${COMPANY.legalName} (${companyAddressLine()}) online mağaza ve fiziki satışları için geçerlidir.`}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">2. {de ? "Vertragsschluss" : "Sözleşme"}</h2>
          <p>
            {de
              ? "Mit Klick auf „Bestellung aufgeben“ geben Sie ein verbindliches Angebot ab. Der Vertrag kommt zustande, wenn wir die Bestellung bestätigen (E-Mail oder telefonisch)."
              : "„Sipariş ver“ butonuna basarak bağlayıcı teklif verirsiniz. Sipariş onaylandığında sözleşme kurulmuş olur."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">3. {de ? "Preise & Zahlung" : "Fiyat & ödeme"}</h2>
          <p>
            {de
              ? "Alle Preise verstehen sich in Euro inkl. gesetzlicher MwSt. (B2B: zzgl. MwSt.). Zahlung online per Karte, Klarna oder PayPal sowie bei Lieferung oder Abholung in bar oder per EC-Karte möglich."
              : "Fiyatlar Euro cinsindendir (B2B: KDV hariç). Online ödeme (kart, Klarna, PayPal) veya teslimat/gel-al sırasında nakit/EC kart ile ödeme mümkündür."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">4. {de ? "Lieferung & Abholung" : "Teslimat & gel-al"}</h2>
          <p>
            {de
              ? "Lieferzeiten und Mindestbestellwerte richten sich nach der gewählten Zone. Bei Abholung gelten die im Checkout angezeigten Zeitfenster."
              : "Teslimat süreleri ve minimum sipariş tutarları seçilen bölgeye göre belirlenir. Gel-al için checkout'ta gösterilen saatler geçerlidir."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">5. {de ? "Gewährleistung" : "Garanti"}</h2>
          <p>
            {de
              ? "Es gelten die gesetzlichen Gewährleistungsrechte. Bei Lebensmitteln bitten wir um Prüfung bei Erhalt."
              : "Yasal garanti hakları geçerlidir. Gıda ürünlerini teslim alırken kontrol etmenizi rica ederiz."}
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-base mb-2">6. {de ? "Kontakt" : "İletişim"}</h2>
          <p>
            {COMPANY.legalName}<br />
            {companyAddressLine()}<br />
            {COMPANY.email} · {COMPANY.phone}
          </p>
        </section>
      </div>
    </div>
  );
}
