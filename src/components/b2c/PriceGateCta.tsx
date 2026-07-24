"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthOptional } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";

/**
 * Fiyat yerine: giriş yapmamışsa Kayıt ol / Giriş yap,
 * girişli ama onaysız / bireyseyse toptancı başvurusu veya onay bekleniyor.
 */
export function PriceGateCta({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;
  const loading = auth?.loading ?? false;

  if (loading) {
    return (
      <p className={cn("text-sm text-bosporus-muted", className)}>
        …
      </p>
    );
  }

  const de = locale !== "tr";

  if (!user) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Link
          href="/register?tab=gewerbe"
          className={cn(
            "inline-flex items-center justify-center font-bold rounded-xl bg-bosporus text-white hover:bg-bosporus-dark transition-colors",
            compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"
          )}
        >
          {de ? "Registrieren" : "Kayıt ol"}
        </Link>
        <Link
          href="/login"
          className={cn(
            "inline-flex items-center justify-center font-semibold rounded-xl border-2 border-bosporus-gray-200 text-bosporus-gray-800 hover:border-bosporus hover:text-bosporus transition-colors",
            compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"
          )}
        >
          {de ? "Anmelden" : "Giriş yap"}
        </Link>
      </div>
    );
  }

  if (profile?.role === "b2b_pending") {
    return (
      <p className={cn("text-sm text-amber-700 font-medium leading-snug", className)}>
        {de
          ? "Preise nach Freigabe Ihres Gewerbekonto."
          : "Fiyatlar kurumsal hesabınız onaylanınca açılır."}
      </p>
    );
  }

  if (profile?.role === "b2c" || profile?.role === "admin") {
    // admin zaten fiyat görebilir (canSeePrices); b2c için yönlendir
    if (profile.role === "admin") return null;
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-xs sm:text-sm text-bosporus-muted leading-snug">
          {de
            ? "Privatverkauf vorübergehend pausiert. Preise nur für freigeschaltete Gewerbekunden."
            : "Bireysel satış geçici olarak kapalı. Fiyatlar sadece onaylı toptancılara açık."}
        </p>
        <Link
          href="/account#gewerbe-upgrade"
          className={cn(
            "inline-flex items-center justify-center font-bold rounded-xl bg-bosporus text-white hover:bg-bosporus-dark transition-colors",
            compact ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm"
          )}
        >
          {de ? "Gewerbe beantragen" : "Toptancı başvurusu"}
        </Link>
      </div>
    );
  }

  return (
    <p className={cn("text-sm text-bosporus-muted", className)}>
      {de ? "Preise nach Anmeldung & Freigabe." : "Fiyatlar kayıt ve onay sonrası."}
    </p>
  );
}
