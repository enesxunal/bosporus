import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "tr"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  // Telefon/WhatsApp Accept-Language=tr olunca kök siteyi /tr'ye atıp Türkçe SEO göstermesin
  localeDetection: false,
});
