"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { ShoppingCart, ArrowRight } from "lucide-react";

export function B2bOrderPanel() {
  const t = useTranslations("cart");
  const tb = useTranslations("b2b");
  const locale = useLocale() as "de" | "tr";
  const { items, subtotalGross, totalItems } = useCart();

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white border border-bosporus-gray-200 rounded-sm sticky top-32 overflow-hidden">
        <div className="bg-metro-navy text-white px-4 py-3 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          <h2 className="text-sm font-bold">{t("title")}</h2>
          {totalItems() > 0 && (
            <span className="ml-auto bg-bosporus-yellow text-metro-navy text-xs font-bold px-2 py-0.5 rounded-sm">
              {totalItems()}
            </span>
          )}
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-sm text-bosporus-muted text-center py-6">{t("empty")}</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {items.slice(0, 5).map((item) => (
                <li key={item.productId} className="text-xs flex justify-between gap-2 border-b border-bosporus-gray-100 pb-2">
                  <span className="truncate text-bosporus-gray-800">{item.name}</span>
                  <span className="shrink-0 font-semibold">×{item.quantity}</span>
                </li>
              ))}
              {items.length > 5 && (
                <li className="text-xs text-bosporus-muted">{tb("moreItems", { count: items.length - 5 })}</li>
              )}
            </ul>
          )}
          <div className="border-t border-bosporus-gray-200 pt-3 mb-4">
            <div className="flex justify-between text-sm font-bold">
              <span>{t("total")}</span>
              <span className="text-bosporus">{formatPrice(subtotalGross(), locale)}</span>
            </div>
            <p className="text-xs text-bosporus-muted mt-1">
              {locale === "de" ? "zzgl. MwSt." : "KDV hariç"}
            </p>
          </div>
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-bosporus text-white text-sm font-bold rounded-sm hover:bg-bosporus-dark transition-colors"
          >
            {t("checkout")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-bosporus-muted bg-bosporus-gray-50 p-2 rounded-sm">
            {tb("minOrderHint")}
          </p>
        </div>
      </div>
    </aside>
  );
}
