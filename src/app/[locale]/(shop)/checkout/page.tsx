"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import {
  findZoneInList,
  getPickupSlotsForDate,
  isDeliveryDayAllowed,
  isPickupDateAllowed,
  zoneDisplayName,
  formatDeliveryDays,
  type DeliveryZoneData,
  type PickupSlotData,
} from "@/lib/delivery-data";
import { Truck, Store } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const ta = useTranslations("account");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const { items, subtotalGross, clear } = useCart();
  const [orderType, setOrderType] = useState<"delivery" | "click_collect">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupSlot, setPickupSlot] = useState("");
  const [zones, setZones] = useState<DeliveryZoneData[]>([]);
  const [pickupSlots, setPickupSlots] = useState<PickupSlotData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<
    { id: string; label: string; street: string; zip_code: string; city: string; is_default: boolean }[]
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const total = subtotalGross();
  const zone = zipCode.length >= 4 ? findZoneInList(zones, zipCode) : null;
  const minOrderOk = !zone || total >= zone.min_order_amount;
  const availablePickupSlots = useMemo(
    () => (pickupDate ? getPickupSlotsForDate(pickupSlots, pickupDate) : []),
    [pickupSlots, pickupDate]
  );

  useEffect(() => {
    fetch("/api/catalog/delivery-config")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.zones ?? []);
        setPickupSlots(d.pickupSlots ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPickupSlot("");
  }, [pickupDate]);

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user?.email) setCustomerEmail(user.email);
      const name = user?.user_metadata?.full_name as string | undefined;
      if (name) setCustomerName(name);

      if (user) {
        const res = await fetch("/api/account/addresses");
        if (res.ok) {
          const data = await res.json();
          const addrs = data.addresses ?? [];
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a: { is_default: boolean }) => a.is_default) ?? addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setZipCode(defaultAddr.zip_code);
            setAddress(defaultAddr.street);
          }
        }
        const profileRes = await fetch("/api/account/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.profile;
          if (p?.first_name || p?.last_name) {
            setCustomerName([p.first_name, p.last_name].filter(Boolean).join(" "));
          }
          if (p?.phone) setCustomerPhone(p.phone);
        }
      }
    });
  }, []);

  const applyAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setZipCode(addr.zip_code);
      setAddress(addr.street);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-narrow py-20 text-center text-bosporus-muted">
        <Link href="/cart" className="text-bosporus font-semibold">{locale === "de" ? "Zum Warenkorb" : "Sepete git"}</Link>
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
      if (!deliveryDate) {
        setError(locale === "de" ? "Lieferdatum wählen" : "Teslimat tarihi seçin");
        return;
      }
      if (!zone) {
        setError(locale === "de" ? "Lieferung in diese PLZ nicht möglich" : "Bu posta koduna teslimat yok");
        return;
      }
      if (!isDeliveryDayAllowed(zone, deliveryDate)) {
        setError(
          locale === "de"
            ? `An diesem Tag keine Lieferung. Mögliche Tage: ${formatDeliveryDays(zone, locale)}`
            : `Bu gün teslimat yok. Uygun günler: ${formatDeliveryDays(zone, locale)}`
        );
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
      if (!isPickupDateAllowed(pickupDate)) {
        setError(locale === "de" ? "Abholung nur Mo–Sa möglich" : "Gel-al sadece Pzt–Cmt");
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
          customerPhone: customerPhone.trim() || undefined,
          zipCode,
          address,
          deliveryDate: orderType === "delivery" ? deliveryDate : undefined,
          pickupDate,
          pickupSlot,
          locale,
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
    <div className="page-narrow py-6 sm:py-10 pb-32 sm:pb-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-2 tracking-tight">{t("title")}</h1>
      <p className="text-sm text-bosporus-muted mb-6">{t("noPaymentNote")}</p>

      <div className="space-y-4">
        <Card>
          <h2 className="font-bold text-bosporus-gray-800 mb-4">{t("contactSection")}</h2>
          <div className="space-y-4">
            <Input label={t("customerName")} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            <Input label={t("customerEmail")} type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
            <Input
              label={t("customerPhone")}
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={locale === "de" ? "+49 221 ..." : "+49 221 ..."}
            />
            <p className="text-xs text-bosporus-muted -mt-2">{t("phoneHint")}</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {(["delivery", "click_collect"] as const).map((type) => {
            const Icon = type === "delivery" ? Truck : Store;
            const active = orderType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all active:scale-[0.98]",
                  active
                    ? "border-bosporus bg-bosporus-light shadow-sm"
                    : "border-bosporus-gray-200 bg-white hover:border-bosporus/30"
                )}
              >
                <Icon className={cn("w-6 h-6", active ? "text-bosporus" : "text-bosporus-muted")} />
                <span className={cn("text-sm font-bold text-center", active ? "text-bosporus" : "text-bosporus-gray-800")}>
                  {type === "delivery" ? t("delivery") : t("pickup")}
                </span>
              </button>
            );
          })}
        </div>

        <Card>
          {orderType === "delivery" ? (
            <div className="space-y-4">
              {savedAddresses.length > 0 && (
                <div>
                  <label className="field-label">{ta("savedAddress")}</label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => applyAddress(e.target.value)}
                    className="field-input"
                  >
                    {savedAddresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label} — {addr.street}, {addr.zip_code}
                      </option>
                    ))}
                    <option value="">{ta("manualAddress")}</option>
                  </select>
                </div>
              )}
              <Input
                label={t("zipCode")}
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setSelectedAddressId(""); }}
                placeholder="50829"
              />
              {zone && (
                <p className="text-xs text-bosporus-muted -mt-2">
                  {zoneDisplayName(zone, locale)} · Min. {formatPrice(zone.min_order_amount, locale)}
                  <br />
                  {locale === "de" ? "Liefertage" : "Teslimat günleri"}: {formatDeliveryDays(zone, locale)}
                </p>
              )}
              <Input
                label={locale === "de" ? "Lieferdatum" : "Teslimat tarihi"}
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <Textarea
                label={t("address")}
                value={address}
                onChange={(e) => { setAddress(e.target.value); setSelectedAddressId(""); }}
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label={t("pickupDate")}
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <div>
                <label className="field-label">{t("pickupSlot")}</label>
                <select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)} className="field-input">
                  <option value="">—</option>
                  {availablePickupSlots.map((s) => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        <Card className="hidden sm:block">
          <div className="flex justify-between items-center text-xl font-extrabold">
            <span>{locale === "de" ? "Gesamt" : "Toplam"}</span>
            <span className="text-bosporus">{formatPrice(total, locale)}</span>
          </div>
        </Card>

        {error && (
          <p className="text-bosporus-red text-sm bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
        )}

        <Button type="button" onClick={handleSubmit} loading={loading} size="lg" fullWidth className="hidden sm:flex">
          {t("placeOrder")}
        </Button>
      </div>

      {/* Mobile sticky order bar */}
      <div className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4 pb-2">
        <Card padding="sm" className="!rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-bosporus-muted font-medium">{locale === "de" ? "Gesamt" : "Toplam"}</p>
              <p className="text-xl font-extrabold text-bosporus">{formatPrice(total, locale)}</p>
            </div>
            <Button type="button" onClick={handleSubmit} loading={loading} size="lg" className="flex-1 max-w-[200px]">
              {t("placeOrder")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
