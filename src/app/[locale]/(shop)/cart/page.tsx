"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { cartLineTotalGross } from "@/lib/pfand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuantityControl } from "@/components/ui/QuantityControl";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type CartAudience = "guest" | "b2c" | "b2b" | "b2b_pending";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as "de" | "tr";
  const { items, updateQuantity, removeItem, subtotalGross, totalItems } = useCart();
  const [audience, setAudience] = useState<CartAudience>("guest");
  const [firstOrderEligible, setFirstOrderEligible] = useState(false);

  const canPay = audience === "b2b";

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAudience("guest");
        setFirstOrderEligible(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role as string | undefined;
        if (role === "b2b_approved") {
          setAudience("b2b");
          const res = await fetch("/api/delivery/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderType: "click_collect", subtotalGross: 0 }),
          });
          if (res.ok) {
            const data = await res.json();
            setFirstOrderEligible(Boolean(data.firstOrderEligible));
          }
          return;
        }
        if (role === "b2b_pending") {
          setAudience("b2b_pending");
          setFirstOrderEligible(false);
          return;
        }

        setAudience("b2c");
        setFirstOrderEligible(false);
      } catch {
        setAudience("b2c");
      }
    });
  }, []);

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

  const deliveryHint =
    audience === "b2b" ? (
      <div className="space-y-1">
        <p className="font-semibold">{t("b2bDeliveryHint")}</p>
        {firstOrderEligible && (
          <p className="font-semibold text-bosporus">{t("b2bFirstOrderHint")}</p>
        )}
      </div>
    ) : audience === "b2b_pending" ? (
      <p className="font-semibold">{t("b2bPendingHint")}</p>
    ) : audience === "b2c" ? (
      <p className="font-semibold">{t("b2cPausedHint")}</p>
    ) : (
      <p>
        <span className="font-semibold">{t("loginForCheckout")} </span>
        <Link href="/register" className="underline font-bold">
          {t("registerLink")}
        </Link>
        {" · "}
        <Link href="/login" className="underline font-bold">
          {t("loginLink")}
        </Link>
      </p>
    );

  return (
    <div className="page-narrow py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-4 tracking-tight">
        {t("title")}
        <span className="text-bosporus-muted font-semibold text-lg ml-2">({totalItems()})</span>
      </h1>

      <div className="mb-5 rounded-2xl bg-bosporus-yellow/90 text-bosporus-gray-800 px-4 py-3 flex gap-3 items-start">
        <Truck className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 text-sm">{deliveryHint}</div>
      </div>

      <ul className="space-y-3 mb-6">
        {items.map((item) => (
          <li key={item.productId}>
            <Card padding="sm" className="!rounded-2xl">
              <div className="flex gap-3 sm:gap-4">
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-bosporus-gray-50 shrink-0">
                    <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-bosporus-light shrink-0 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-bosporus/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-bosporus-gray-800 text-sm sm:text-base line-clamp-2">{item.name}</h3>
                  {item.pfand && (
                    <p className="text-xs text-bosporus-muted mt-1">
                      + {locale === "de" ? "Pfand" : "Depozito"}:{" "}
                      {formatPrice(item.pfand.priceGross * item.quantity, locale)}
                    </p>
                  )}
                  <p className="text-bosporus font-bold mt-2 text-lg">
                    {formatPrice(cartLineTotalGross(item), locale)}
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

      <Card className="hidden sm:block !rounded-2xl">
        <div className="flex justify-between items-center text-xl font-extrabold mb-5">
          <span>{t("total")}</span>
          <span className="text-bosporus">{formatPrice(subtotalGross(), locale)}</span>
        </div>
        {canPay ? (
          <Link href="/checkout">
            <Button size="lg" fullWidth>
              {t("checkout")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <div className="space-y-3">
            <Button size="lg" fullWidth disabled>
              {locale === "tr" ? "Ödeme için toptancı onayı gerekli" : "Kasse nur mit Gewerbe-Freigabe"}
            </Button>
            <p className="text-center text-sm text-bosporus-muted">
              <Link href="/register" className="font-bold text-bosporus hover:underline">
                {t("registerLink")}
              </Link>
              {" · "}
              <Link href="/login" className="font-bold text-bosporus hover:underline">
                {t("loginLink")}
              </Link>
            </p>
          </div>
        )}
      </Card>

      <div className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4 pb-2">
        <Card padding="sm" className="!rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-bosporus-muted font-medium">{t("total")}</p>
              <p className="text-xl font-extrabold text-bosporus">{formatPrice(subtotalGross(), locale)}</p>
            </div>
            {canPay ? (
              <Link href="/checkout" className="flex-1 max-w-[200px]">
                <Button size="lg" fullWidth>
                  {t("checkout")}
                </Button>
              </Link>
            ) : (
              <Link href="/register" className="flex-1 max-w-[200px]">
                <Button size="lg" fullWidth>
                  {locale === "tr" ? "Kayıt ol" : "Registrieren"}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
