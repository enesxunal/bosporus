import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, Clock, ExternalLink, MessageCircle, Store, Building2, Car } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/b2c/ContactForm";
import { COMPANY, storeOpeningHoursLine } from "@/lib/company";
import { shopPageMetadata } from "@/lib/page-seo";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Von-H%C3%BCnefeld-Str.+2,+50829+K%C3%B6ln";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/contact", locale);
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const whatsappHref = `https://wa.me/${COMPANY.whatsappPhone.replace(/\D/g, "")}`;

  const items = [
    { icon: MapPin, label: t("addressLabel"), text: `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`, href: MAP_URL, external: true },
    { icon: Phone, label: t("phoneLabel"), text: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, label: "WhatsApp", text: COMPANY.whatsappPhone, href: whatsappHref, external: true },
    { icon: Mail, label: t("emailLabel"), text: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { icon: Clock, label: t("hoursLabel"), text: storeOpeningHoursLine(locale) },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-bosporus to-bosporus-dark text-white">
        <div className="page-container py-10 sm:py-14">
          <p className="text-bosporus-yellow text-sm font-bold uppercase tracking-wide mb-2">Bosporus GmbH</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">{t("title")}</h1>
          <p className="text-white/85 max-w-xl text-base sm:text-lg">{t("subtitle")}</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-bosporus-muted uppercase tracking-wide">{COMPANY.legalName}</p>
            {items.map(({ icon: Icon, label, text, href, external }) => (
              <Card key={label} padding="sm" className="!rounded-2xl">
                {href ? (
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-11 h-11 bg-bosporus-light rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-bosporus" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-bosporus-muted uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-bosporus-gray-800 font-medium group-hover:text-bosporus break-words">{text}</p>
                      {external && label === t("addressLabel") && (
                        <span className="inline-flex items-center gap-1 text-xs text-bosporus mt-1 font-semibold">
                          {t("mapCta")} <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-bosporus-light rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-bosporus" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-bosporus-muted uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-bosporus-gray-800 font-medium">{text}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            <Card padding="sm" className="!rounded-2xl space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Store className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-bosporus-gray-800">Einkauf vor Ort</p>
                  <p className="text-bosporus-muted">Auch für Privatkunden möglich.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Building2 className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-bosporus-gray-800">Online-Shop</p>
                  <p className="text-bosporus-muted">Nur für Gewerbekunden.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Car className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-bosporus-gray-800">Parkplätze</p>
                  <p className="text-bosporus-muted">Vor Ort verfügbar.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
