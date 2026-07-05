"use client";

import type { DisplayPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/pricing";
import type { Locale } from "@/lib/types";

interface PriceDisplayProps {
  price: DisplayPrice;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  price,
  locale,
  size = "md",
  className = "",
}: PriceDisplayProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-lg font-semibold",
    lg: "text-2xl font-bold",
  }[size];

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {price.isPromo && price.originalAmount != null && (
          <span className="text-sm text-bosporus-muted line-through">
            {formatPrice(price.originalAmount, locale)}
          </span>
        )}
        <span
          className={`${sizeClass} ${price.isPromo ? "text-bosporus-red" : "text-bosporus"}`}
        >
          {formatPrice(price.amount, locale)}
        </span>
        {price.isPromo && (
          <span className="text-xs font-medium text-bosporus-red bg-red-50 px-1.5 py-0.5 rounded">
            %
          </span>
        )}
      </div>
      <span className="text-xs text-bosporus-muted">
        {price.label === "brutto"
          ? locale === "de"
            ? "inkl. MwSt."
            : "KDV dahil"
          : locale === "de"
            ? "zzgl. MwSt."
            : "KDV hariç"}
      </span>
    </div>
  );
}
