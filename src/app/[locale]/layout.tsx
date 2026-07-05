import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Source_Sans_3 } from "next/font/google";
import { routing } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { CookieConsent } from "@/components/layout/CookieConsent";
import "../globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans",
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(COMPANY.website),
    title: { default: t("title"), template: `%s | Bosporus` },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "Bosporus",
      locale: locale === "tr" ? "tr_TR" : "de_DE",
      type: "website",
    },
    alternates: {
      languages: { de: "/", tr: "/tr" },
    },
    appleWebApp: { capable: true, title: "Bosporus" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1d71b8",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "de" | "tr")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${sourceSans.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
