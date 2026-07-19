import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Source_Sans_3 } from "next/font/google";
import { routing } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { absoluteUrl, organizationJsonLd } from "@/lib/seo";
import { SITE_SEO } from "@/lib/page-seo";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AnalyticsLoader } from "@/components/layout/AnalyticsLoader";
import "../globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
  display: "swap",
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
  const isTr = locale === "tr";
  return {
    metadataBase: new URL(COMPANY.website),
    title: { default: SITE_SEO.title, template: `%s | Bosporus` },
    description: SITE_SEO.description,
    openGraph: {
      title: SITE_SEO.title,
      description: SITE_SEO.description,
      siteName: "Bosporus",
      locale: "de_DE",
      alternateLocale: ["tr_TR"],
      type: "website",
      url: absoluteUrl("/"),
      images: [{ url: "/categories/lebensmittel.jpg", width: 1200, height: 900 }],
    },
    alternates: {
      canonical: "/",
      languages: {
        de: "/",
        "de-DE": "/",
        tr: "/tr",
        "x-default": "/",
      },
    },
    appleWebApp: { capable: true, title: "Bosporus" },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    robots: isTr
      ? { index: false, follow: true }
      : { index: true, follow: true },
    verification: {
      google: [
        "gmPQ8hYCh8AGY0f5LVkSZHdDUhKbMtb3Waw6PJuyeMU",
        "HV3L4n_SxeL-eJF8fAn0uRQfXhI27q-4y9iBMGaelPE",
      ],
    },
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
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('bosporus-cookie-consent')==='accepted')return;}catch(e){}document.documentElement.classList.add('cookie-gate-pending');})();`,
          }}
        />
      </head>
      <body className={`${sourceSans.variable} antialiased`}>
        <div id="cookie-gate-block" aria-hidden="true" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
          <AnalyticsLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
