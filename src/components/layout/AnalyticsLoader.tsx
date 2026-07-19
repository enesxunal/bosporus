"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { flushPendingAnalytics } from "@/lib/analytics";

const STORAGE_KEY = "bosporus-cookie-consent";
const GTM_ID = "GTM-TP6KXQHQ";
const GA_MEASUREMENT_ID = "G-1V65SZPKDL";

/**
 * Pazarlama script’lerini ilk boyamadan sonra / çerez onayından sonra yükler.
 * PageSpeed + LCP için GTM/GA ana thread’i bloklamasın.
 */
export function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const enable = () => {
      if (!cancelled) setEnabled(true);
    };

    const schedule = () => {
      const run = () => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (
            window as Window & {
              requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
            }
          ).requestIdleCallback(enable, { timeout: 3500 });
        } else {
          timer = setTimeout(enable, 2500);
        }
      };
      timer = setTimeout(run, 800);
    };

    try {
      if (localStorage.getItem(STORAGE_KEY) === "accepted") {
        schedule();
      }
    } catch {
      /* private mode */
    }

    const onAccepted = () => schedule();
    window.addEventListener("bosporus-cookie-accepted", onAccepted);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("bosporus-cookie-accepted", onAccepted);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const tryFlush = () => flushPendingAnalytics();
    tryFlush();
    const t1 = setTimeout(tryFlush, 1500);
    const t2 = setTimeout(tryFlush, 4000);
    window.addEventListener("bosporus-analytics-ready", tryFlush);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("bosporus-analytics-ready", tryFlush);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script id="gtm" strategy="lazyOnload">{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}</Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
        onLoad={() => {
          try {
            window.dispatchEvent(new Event("bosporus-analytics-ready"));
          } catch {
            /* ignore */
          }
          flushPendingAnalytics();
        }}
      />
      <Script id="ga4-config" strategy="lazyOnload">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
        try { window.dispatchEvent(new Event('bosporus-analytics-ready')); } catch (e) {}
      `}</Script>
    </>
  );
}
