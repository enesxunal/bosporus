"use client";

import { useEffect } from "react";

const RELOAD_KEY = "bosporus-chunk-reload";

function isStaleChunkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("loading chunk") ||
    m.includes("chunkloaderror") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("error loading dynamically imported module")
  );
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    if (last && Date.now() - last < 20_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* private mode – yine de yenile */
  }
  window.location.reload();
}

/**
 * Yayın sonrası eski sekmede kalan JS parçaları yeni sürümle uyuşmayınca
 * Chrome “This page couldn't load” benzeri boş/hata ekranı verebiliyor.
 * Bir kez otomatik yenileyerek toparlar.
 */
export function ChunkErrorRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isStaleChunkError(String(event.message || event.error?.message || ""))) {
        reloadOnce();
      }
    };
    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason && typeof reason === "object" && "message" in reason
          ? String((reason as { message: unknown }).message)
          : String(reason ?? "");
      if (isStaleChunkError(msg)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  return null;
}
