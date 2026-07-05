"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Phone, Mail, Shield, Truck, CreditCard } from "lucide-react";

export function B2cFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const trust = [
    { icon: Truck, label: "Schnelle Lieferung Köln" },
    { icon: Shield, label: "Geprüfte Qualität" },
    { icon: CreditCard, label: "Sichere Zahlung" },
  ];

  return (
    <footer className="mt-auto pb-mobile-nav md:pb-0">
      {/* Trust bar — Lidl style */}
      <div className="bg-bosporus-light border-t border-bosporus-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center sm:justify-start">
              <Icon className="w-5 h-5 text-bosporus shrink-0" />
              <span className="text-sm font-semibold text-bosporus-gray-800">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-metro-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Image src="/logo.svg" alt="Bosporus" width={110} height={36} className="h-7 w-auto brightness-0 invert mb-4" />
            <p className="text-sm text-white/75 leading-relaxed">{t("tagline")}</p>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-bosporus-yellow">{nav("products")}</h3>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/" className="hover:text-white">{nav("home")}</Link></li>
              <li><Link href="/products" className="hover:text-white">{nav("products")}</Link></li>
              <li><Link href="/gewerbe" className="hover:text-white">{nav("b2bPortal")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-bosporus-yellow">{nav("contact")}</h3>
            <ul className="space-y-2 text-sm text-white/75">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />Von Hünefeld Str. 2, 50829 Köln</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" />+49 221 34098290</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" />info@bosporus-gmbh.com</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-bosporus-yellow">Info</h3>
            <p className="text-sm text-white/75 mb-3">{t("hours")}</p>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/impressum" className="hover:text-white">{t("imprint")}</Link></li>
              <li><Link href="/datenschutz" className="hover:text-white">{t("privacy")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Bosporus GmbH
        </div>
      </div>
    </footer>
  );
}
