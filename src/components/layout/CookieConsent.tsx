"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "bosporus-cookie-consent";

export function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-4 md:inset-x-auto md:left-4 md:right-4 md:max-w-2xl md:mx-auto pointer-events-none"
    >
      <div className="pointer-events-auto bg-metro-navy text-white rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-bosporus/20 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-bosporus-yellow" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm sm:text-base">{t("title")}</p>
            <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
              {t("message")}{" "}
              <Link href="/datenschutz" className="underline hover:text-bosporus-yellow whitespace-nowrap">
                {t("privacy")}
              </Link>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 w-full sm:w-auto px-5 py-2.5 bg-bosporus-yellow text-metro-navy text-sm font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
