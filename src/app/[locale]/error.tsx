"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isTr = locale === "tr";

  useEffect(() => {
    const msg = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
    const stale =
      msg.includes("loading chunk") ||
      msg.includes("chunkloaderror") ||
      msg.includes("failed to fetch dynamically imported module");
    if (!stale) return;
    try {
      const key = "bosporus-error-reload";
      const last = Number(sessionStorage.getItem(key) || "0");
      if (last && Date.now() - last < 20_000) return;
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center bg-bosporus-gray-50">
      <h1 className="text-xl font-bold text-metro-navy mb-2">
        {isTr ? "Sayfa yüklenemedi" : "Seite konnte nicht geladen werden"}
      </h1>
      <p className="text-sm text-bosporus-muted mb-6 max-w-md">
        {isTr
          ? "Yenileyince genellikle düzelir. Devam etmek için tekrar deneyin."
          : "Ein Neuladen hilft meist. Bitte versuchen Sie es erneut."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 px-5 rounded-xl bg-bosporus text-white font-bold text-sm"
        >
          {isTr ? "Yenile" : "Neu laden"}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="h-11 px-5 rounded-xl border border-bosporus-gray-200 bg-white text-metro-navy font-bold text-sm"
        >
          {isTr ? "Tekrar dene" : "Erneut versuchen"}
        </button>
      </div>
    </div>
  );
}
