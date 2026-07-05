"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { findDeliveryZone, PICKUP_SLOTS, zoneName } from "@/lib/delivery";
import { Truck, Store, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const { items, subtotalGross, clear } = useCart();
  const [orderType, setOrderType] = useState<"delivery" | "click_collect">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = subtotalGross();
  const zone = zipCode.length >= 4 ? findDeliveryZone(zipCode) : null;
  const minOrderOk = !zone || total >= zone.min_order_amount;

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setCustomerEmail(user.email);
      const name = user?.user_metadata?.full_name as string | undefined;
      if (name) setCustomerName(name);
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-bosporus-muted">
        <Link href="/cart">{locale === "de" ? "Zum Warenkorb" : "Sepete git"}</Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    if (!customerName.trim() || !customerEmail.trim()) {
      setError(t("contactRequired"));
      return;
    }
    if (orderType === "delivery") {
      if (!zipCode || !address) {
        setError(locale === "de" ? "PLZ und Adresse erforderlich" : "Posta kodu ve adres gerekli");
        return;
      }
      if (!zone) {
        setError(locale === "de" ? "Lieferung in diese PLZ nicht möglich" : "Bu posta koduna teslimat yok");
        return;
      }
      if (!minOrderOk) {
        setError(t("minOrderWarning", { amount: formatPrice(zone.min_order_amount, locale) }));
        return;
      }
    } else {
      if (!pickupDate || !pickupSlot) {
        setError(locale === "de" ? "Abholdatum und -zeit wählen" : "Alış tarihi ve saati seçin");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          orderType,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          zipCode,
          address,
          pickupDate,
          pickupSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler");
        return;
      }
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-2">{t("title")}</h1>
      <p className="text-sm text-bosporus-muted mb-6">{t("noPaymentNote")}</p>

      <div className="space-y-4 mb-6 p-4 bg-white border border-bosporus-gray-200 rounded-sm">
        <h2 className="font-semibold text-sm">{t("contactSection")}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">{t("customerName")}</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("customerEmail")}</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setOrderType("delivery")}
          className={`flex items-center justify-center gap-2 p-4 rounded-sm border-2 transition-colors ${
            orderType === "delivery" ? "border-bosporus bg-bosporus-light" : "border-bosporus-gray-200"
          }`}
        >
          <Truck className="w-5 h-5" />
          {t("delivery")}
        </button>
        <button
          type="button"
          onClick={() => setOrderType("click_collect")}
          className={`flex items-center justify-center gap-2 p-4 rounded-sm border-2 transition-colors ${
            orderType === "click_collect" ? "border-bosporus bg-bosporus-light" : "border-bosporus-gray-200"
          }`}
        >
          <Store className="w-5 h-5" />
          {t("pickup")}
        </button>
      </div>

      {orderType === "delivery" ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">{t("zipCode")}</label>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
              placeholder="50829"
            />
            {zone && (
              <p className="text-xs text-bosporus-muted mt-1">
                {zoneName(zone, locale)} · Min. {formatPrice(zone.min_order_amount, locale)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("address")}</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">{t("pickupDate")}</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("pickupSlot")}</label>
            <select
              value={pickupSlot}
              onChange={(e) => setPickupSlot(e.target.value)}
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            >
              <option value="">—</option>
              {PICKUP_SLOTS.map((s) => (
                <option key={s.value} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-bosporus-gray-50 p-6 rounded-sm border mb-6">
        <div className="flex justify-between text-lg font-bold">
          <span>{locale === "de" ? "Gesamt" : "Toplam"}</span>
          <span className="text-bosporus">{formatPrice(total, locale)}</span>
        </div>
      </div>

      {error && (
        <p className="text-bosporus-red text-sm mb-4 bg-red-50 p-3 rounded-sm">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-bosporus text-white font-semibold rounded-sm hover:bg-bosporus-dark disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("placeOrder")}
      </button>
    </div>
  );
}
