"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isB2BApproved, type UserProfile } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Bireysel fiyatları “pahalı” diye damgalamadan:
 * sadece gastronomi / toptancıya kibar bir yönlendirme.
 */
export function WholesalePriceHint({
  profile,
  className,
  compact = false,
}: {
  profile?: UserProfile | null;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations("product");
  if (isB2BApproved(profile ?? null)) return null;

  return (
    <p
      className={cn(
        "text-bosporus-muted leading-snug",
        compact ? "text-[10px] sm:text-[11px] mt-1" : "text-xs sm:text-sm mt-2",
        className
      )}
    >
      {t.rich("wholesaleHint", {
        link: (chunks) => (
          <Link
            href="/register?tab=gewerbe"
            className="font-semibold text-bosporus hover:underline underline-offset-2"
          >
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
