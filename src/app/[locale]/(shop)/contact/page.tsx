import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/b2c/ContactForm";
import { COMPANY, companyAddressLine } from "@/lib/company";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const items = [
    { icon: MapPin, text: companyAddressLine() },
    { icon: Phone, text: COMPANY.phone, href: "tel:+4922134098290" },
    { icon: Mail, text: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { icon: Clock, text: t("hours") },
  ];

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-8 tracking-tight">{t("title")}</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="grid gap-3 content-start">
          {items.map(({ icon: Icon, text, href }) => (
            <Card key={text} padding="sm" hover className="!rounded-2xl">
              {href ? (
                <a href={href} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-bosporus-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-bosporus" />
                  </div>
                  <span className="text-bosporus-gray-800 font-medium group-hover:text-bosporus">{text}</span>
                </a>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-bosporus-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-bosporus" />
                  </div>
                  <span className="text-bosporus-gray-800 font-medium">{text}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
