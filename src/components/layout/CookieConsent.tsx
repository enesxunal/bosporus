"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Cookie } from "lucide-react";

export const COOKIE_CONSENT_KEY = "bosporus-cookie-consent";

function clearGate() {
  try {
    document.documentElement.classList.remove("cookie-gate-pending");
    document.getElementById("cookie-gate-block")?.remove();
  } catch {
    /* ignore */
  }
}

export function CookieConsent() {
  const t = useTranslations("cookies");
  /** null = henüz kontrol edilmedi → SSR’da duvar gösterme (yanlış siyah ekran olmasın) */
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted") {
        clearGate();
        setVisible(false);
        return;
      }
    } catch {
      /* private mode → duvarı göster */
    }
    document.documentElement.classList.add("cookie-gate-pending");
    document.body.style.overflow = "hidden";
    setVisible(true);
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // ignore
    }
    clearGate();
    document.body.style.overflow = "";
    setVisible(false);
    try {
      window.dispatchEvent(new Event("bosporus-cookie-accepted"));
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={t("title")}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="absolute inset-0 bg-metro-navy/80 backdrop-blur-sm" aria-hidden />

      <div className="relative w-full max-w-lg bg-metro-navy text-white rounded-2xl shadow-2xl border border-white/15 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-bosporus/25 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-bosporus-yellow" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg sm:text-xl tracking-tight">{t("title")}</p>
            <p className="text-sm text-white/85 mt-2 leading-relaxed">
              {t("message")}{" "}
              <Link
                href="/datenschutz"
                className="underline hover:text-bosporus-yellow whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {t("privacy")}
              </Link>
            </p>
            <p className="text-xs text-white/60 mt-2">{t("requiredHint")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={accept}
          className="w-full px-5 py-3.5 bg-bosporus-yellow text-metro-navy text-sm sm:text-base font-bold rounded-xl hover:bg-yellow-300 active:scale-[0.99] transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
