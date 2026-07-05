"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuantityControl } from "@/components/ui/QuantityControl";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as "de" | "tr";
  const { items, updateQuantity, removeItem, subtotalGross, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="page-narrow py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-bosporus-light mb-6">
          <ShoppingBag className="w-10 h-10 text-bosporus" />
        </div>
        <h1 className="text-xl font-bold text-bosporus-gray-800 mb-2">{t("title")}</h1>
        <p className="text-bosporus-muted mb-8">{t("empty")}</p>
        <Link href="/products">
          <Button size="lg">
            {t("continue")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-narrow py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6 tracking-tight">
        {t("title")}
        <span className="text-bosporus-muted font-semibold text-lg ml-2">({totalItems()})</span>
      </h1>

      <ul className="space-y-3 mb-6">
        {items.map((item) => (
          <li key={item.productId}>
            <Card padding="sm" className="!rounded-2xl">
              <div className="flex gap-3 sm:gap-4">
                {item.imageUrl && (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-bosporus-gray-50 shrink-0">
                    <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-bosporus-gray-800 text-sm sm:text-base line-clamp-2">{item.name}</h3>
                  <p className="text-xs text-bosporus-muted mt-0.5">{item.sku}</p>
                  <p className="text-bosporus font-bold mt-2 text-lg">
                    {formatPrice(item.priceGross * item.quantity, locale)}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="touch-target flex items-center justify-center text-bosporus-muted hover:text-bosporus-red hover:bg-red-50 rounded-xl transition-colors"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <QuantityControl
                    size="sm"
                    value={item.quantity}
                    onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                    onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {/* Desktop summary */}
      <Card className="hidden sm:block !rounded-2xl">
        <div className="flex justify-between items-center text-xl font-extrabold mb-5">
          <span>{t("total")}</span>
          <span className="text-bosporus">{formatPrice(subtotalGross(), locale)}</span>
        </div>
        <Link href="/checkout">
          <Button size="lg" fullWidth>
            {t("checkout")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </Card>

      {/* Mobile sticky checkout bar */}
      <div className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4 pb-2">
        <Card padding="sm" className="!rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-bosporus-muted font-medium">{t("total")}</p>
              <p className="text-xl font-extrabold text-bosporus">{formatPrice(subtotalGross(), locale)}</p>
            </div>
            <Link href="/checkout" className="flex-1 max-w-[200px]">
              <Button size="lg" fullWidth>
                {t("checkout")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
