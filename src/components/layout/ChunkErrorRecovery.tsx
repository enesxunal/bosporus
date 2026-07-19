"use client";

import { useEffect } from "react";

const RELOAD_KEY = "bosporus-chunk-reload";

function isStaleAssetError(message: string): boolean {
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
    /* private mode */
  }
  window.location.reload();
}

/**
 * Yayın sonrası eski sekme / soft-navigate: Chrome bazen
 * “This page couldn't load” gösterir. Bir kez yenileyerek toparlar.
 */
export function ChunkErrorRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const msg = String(event.message || event.error?.message || "");
      if (isStaleAssetError(msg)) reloadOnce();
    };

    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason && typeof reason === "object" && "message" in reason
          ? String((reason as { message: unknown }).message)
          : String(reason ?? "");
      if (isStaleAssetError(msg)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    const onScriptError = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLScriptElement)) return;
      const src = el.src || "";
      if (src.includes("/_next/")) reloadOnce();
    };

    // bfcache’ten dönüşte bozuk sayfa
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        try {
          const mark = sessionStorage.getItem("bosporus-dpl");
          const current = document.documentElement.getAttribute("data-dpl-id");
          if (mark && current && mark !== current) reloadOnce();
          if (current) sessionStorage.setItem("bosporus-dpl", current);
        } catch {
          /* ignore */
        }
      }
    };

    try {
      const current = document.documentElement.getAttribute("data-dpl-id");
      if (current) sessionStorage.setItem("bosporus-dpl", current);
    } catch {
      /* ignore */
    }

    window.addEventListener("error", onError);
    window.addEventListener("error", onScriptError, true);
    window.addEventListener("unhandledrejection", onReject);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("error", onScriptError, true);
      window.removeEventListener("unhandledrejection", onReject);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
