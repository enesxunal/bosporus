"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase magic-link / signup redirect.
 * Tokens often arrive in the URL hash (#access_token=…) which the server never sees,
 * so this page must run in the browser.
 */
export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Anmeldung wird bestätigt…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const nextRaw = params.get("next") || hash.get("next") || "/login";
      const next = nextRaw.startsWith("/") ? nextRaw : "/login";
      const code = params.get("code");

      try {
        if (code) {
          // PKCE: sunucu çerezleri ayarlasın
          window.location.replace(
            `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
          );
          return;
        }

        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        const supabase = createClient();

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else {
          // Fallback: let client parse URL if configured
          await supabase.auth.getSession();
        }

        if (!cancelled) {
          window.location.replace(next);
        }
      } catch (e) {
        console.error("auth callback:", e);
        if (!cancelled) {
          setMessage("Bestätigung fehlgeschlagen. Bitte erneut anmelden.");
          setTimeout(() => window.location.replace("/login?error=auth"), 2000);
        }
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bosporus-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-10 h-10 border-2 border-bosporus border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-bosporus-gray-800 font-semibold">{message}</p>
        <p className="text-sm text-bosporus-muted mt-2">Bosporus GmbH</p>
      </div>
    </div>
  );
}
