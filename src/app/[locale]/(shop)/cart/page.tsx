"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as "de" | "tr";
  const { items, updateQuantity, removeItem, subtotalGross, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-bosporus-muted mx-auto mb-4" />
        <p className="text-bosporus-muted mb-6">{t("empty")}</p>
        <Link href="/products" className="text-bosporus font-medium hover:underline">
          {t("continue")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-6">
        {t("title")} ({totalItems()})
      </h1>
      <ul className="space-y-4 mb-8">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex gap-4 p-4 bg-white border border-bosporus-gray-200 rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-bosporus-gray-800 truncate">{item.name}</h3>
              <p className="text-sm text-bosporus-muted">{item.sku}</p>
              <p className="text-bosporus font-semibold mt-1">
                {formatPrice(item.priceGross, locale)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="p-1.5 border rounded hover:bg-bosporus-light"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="p-1.5 border rounded hover:bg-bosporus-light"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="p-1.5 text-bosporus-red hover:bg-red-50 rounded ml-2"
                aria-label={t("remove")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="bg-bosporus-gray-50 p-6 rounded-xl border border-bosporus-gray-200">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>{t("total")}</span>
          <span className="text-bosporus">{formatPrice(subtotalGross(), locale)}</span>
        </div>
        <Link
          href="/checkout"
          className="block w-full py-3 bg-bosporus text-white text-center font-semibold rounded-lg hover:bg-bosporus-dark transition-colors"
        >
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
