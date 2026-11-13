"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { isB2BApproved } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { isPaymentTestSku } from "@/lib/payment-test-product";

/** On-site cart recovery only; no email/WhatsApp, no new visitor tracking. */
export function CartResumePrompt() {
  const locale = useLocale();
  const auth = useAuthOptional();
  const profile = auth?.b2bProfile ?? auth?.profile ?? null;
  const items = useCart((s) => s.items);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait until the client has hydrated the existing locally saved cart.
    queueMicrotask(() => setReady(true));
  }, []);

  if (!ready || !isB2BApproved(profile)) return null;
  const itemsCount = items
    .filter((item) => !isPaymentTestSku(item.sku))
    .reduce((sum, item) => sum + item.quantity, 0);
  if (itemsCount < 1) return null;

  return (
    <aside className="bg-bosporus-light border-b border-bosporus/15" aria-label={locale === "de" ? "Warenkorb fortsetzen" : "Sepete devam et"}>
      <div className="page-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 rounded-xl bg-white p-2 text-bosporus">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-bosporus-gray-800">
              {locale === "de" ? "Ihr Warenkorb ist noch da" : "Sepetiniz sizi bekliyor"}
            </p>
            <p className="text-xs sm:text-sm text-bosporus-muted">
              {locale === "de"
                ? `${itemsCount} Artikel liegen noch im Warenkorb. Preise werden vor dem Abschluss geprüft.`
                : `Sepetinizde ${itemsCount} ürün bulunuyor. Fiyatlar siparişten önce kontrol edilir.`}
            </p>
          </div>
        </div>
        <Link
          href="/cart"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-bosporus px-4 py-2.5 text-sm font-bold text-white hover:bg-bosporus-dark"
        >
          {locale === "de" ? "Warenkorb fortsetzen" : "Sepete devam et"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
