"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { MapPin, Phone, Mail, Truck, Shield, Banknote } from "lucide-react";

export function B2cFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const legal = useTranslations("legal");

  const shopLinks = [
    { href: "/", label: nav("home") },
    { href: "/products", label: nav("products") },
    { href: "/products", label: nav("b2bPortal") },
    { href: "/order/track", label: t("trackOrder") },
  ];

  const companyLinks = [
    { href: "/about", label: nav("about") },
    { href: "/contact", label: nav("contact") },
  ];

  const legalLinks = [
    { href: "/impressum", label: t("imprint") },
    { href: "/datenschutz", label: t("privacy") },
    { href: "/agb", label: legal("terms") },
    { href: "/faq", label: legal("faq") },
    { href: "/widerruf", label: legal("returns") },
  ];

  const trust = [
    { icon: Truck, label: t("trustDelivery") },
    { icon: Shield, label: t("trustQuality") },
    { icon: Banknote, label: t("trustPayment") },
  ];

  return (
    <footer className="mt-auto pb-mobile-nav md:pb-0">
      <div className="bg-bosporus-light border-t border-bosporus-gray-200">
        <div className="page-container py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center sm:justify-start">
              <Icon className="w-5 h-5 text-bosporus shrink-0" />
              <span className="text-sm font-semibold text-bosporus-gray-800">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-metro-navy text-white">
        <div className="page-container py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Marka + iletişim özeti */}
            <div className="lg:col-span-4">
              <Image
                src="/logo.svg"
                alt="Bosporus"
                width={140}
                height={46}
                className="h-9 sm:h-10 w-auto brightness-0 invert mb-4"
              />
              <p className="text-sm text-white/75 leading-relaxed mb-4">{t("tagline")}</p>
              <p className="text-xs text-white/50 mb-4">{t("hours")}</p>
              <ul className="space-y-2 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-bosporus-yellow" />
                  <span>{companyAddressLine()}</span>
                </li>
                <li>
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white">
                    <Phone className="w-4 h-4 text-bosporus-yellow" />
                    {COMPANY.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-white">
                    <Mail className="w-4 h-4 text-bosporus-yellow" />
                    {COMPANY.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Mağaza */}
            <div className="lg:col-span-2">
              <h3 className="font-bold mb-3 text-xs uppercase tracking-wider text-bosporus-yellow">
                {t("shopSection")}
              </h3>
              <ul className="space-y-2.5 text-sm text-white/75">
                {shopLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Şirket */}
            <div className="lg:col-span-2">
              <h3 className="font-bold mb-3 text-xs uppercase tracking-wider text-bosporus-yellow">
                {t("companySection")}
              </h3>
              <ul className="space-y-2.5 text-sm text-white/75">
                {companyLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yasal */}
            <div className="lg:col-span-4 sm:col-span-2">
              <h3 className="font-bold mb-3 text-xs uppercase tracking-wider text-bosporus-yellow">
                {t("legalSection")}
              </h3>
              <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/75">
                {legalLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="page-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/45">
            <span>© {new Date().getFullYear()} {COMPANY.legalName}</span>
            <span className="text-white/35">USt-IdNr. {COMPANY.vatId}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
