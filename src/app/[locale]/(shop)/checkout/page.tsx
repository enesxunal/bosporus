"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import {
  findZoneInList,
  getAvailablePickupSlotsForDate,
  isDeliveryDayAllowed,
  isPickupDateAllowed,
  zoneDisplayName,
  getNextDeliveryDates,
  formatDisplayDate,
  formatDeliveryWindowHint,
  getEarliestDeliveryDateISO,
  DELIVERY_WINDOW_LABEL,
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
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import { StripeCheckout } from "@/components/checkout/StripeCheckout";
import { BeginCheckoutTracker } from "@/components/analytics/BeginCheckoutTracker";

interface DeliveryQuoteView {
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  maxDistanceKm: number | null;
  distanceKm: number | null;
  deliveryFee: number;
  totalGross: number;
  minOrderMet: boolean;
  withinRadius: boolean;
  freeDelivery: boolean;
  freeReason?: "threshold" | "first_order" | null;
  subtotalGross: number;
}

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
  const [paypalConfig, setPaypalConfig] = useState<{
    enabled: boolean;
    ready?: boolean;
    issue?: string;
    clientId?: string;
    mode?: "live" | "sandbox";
  }>({ enabled: false });
  const [stripeConfig, setStripeConfig] = useState<{ enabled: boolean }>({ enabled: false });
  const [isB2b, setIsB2b] = useState(false);
  const [quote, setQuote] = useState<DeliveryQuoteView | null>(null);
  const [firstOrderEligible, setFirstOrderEligible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const subtotal = subtotalGross();
  const zone = zipCode.length >= 4 ? findZoneInList(zones, zipCode) : null;
  const deliveryFee = orderType === "delivery" ? (quote?.deliveryFee ?? 0) : 0;
  const grandTotal = quote?.totalGross ?? subtotal;
  const availablePickupSlots = useMemo(
    () => (pickupDate ? getAvailablePickupSlotsForDate(pickupSlots, pickupDate) : []),
    [pickupSlots, pickupDate]
  );
  const earliestDeliveryDate = getEarliestDeliveryDateISO();
  const suggestedDeliveryDates = useMemo(
    () => (zone ? getNextDeliveryDates(zone, 4) : getNextDeliveryDates(
      { id: "", name_de: "", name_tr: "", zip_prefixes: [], min_order_amount: 0, delivery_days: [] },
      4
    )),
    [zone]
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
    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.enabled) setStripeConfig({ enabled: true });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/paypal/create-order")
      .then((r) => r.json())
      .then((d) => {
        if (d.enabled && d.clientId) {
          setPaypalConfig({
            enabled: true,
            ready: d.ready !== false,
            issue: d.issue,
            clientId: d.clientId,
            mode: d.mode,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPickupSlot("");
  }, [pickupDate]);

  useEffect(() => {
    if (pickupSlot && !availablePickupSlots.some((s) => s.label === pickupSlot)) {
      setPickupSlot("");
    }
  }, [availablePickupSlots, pickupSlot]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderType === "delivery" && zipCode.replace(/\s/g, "").length < 4) {
        setQuote(null);
        return;
      }

      fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          subtotalGross: subtotal,
          zipCode: orderType === "delivery" ? zipCode : undefined,
          address: orderType === "delivery" ? address : undefined,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.isB2b != null) setIsB2b(Boolean(d.isB2b));
          setFirstOrderEligible(Boolean(d.firstOrderEligible));
          setQuote(d.quote ?? null);
        })
        .catch(() => setQuote(null));
    }, 450);

    return () => clearTimeout(timer);
  }, [orderType, zipCode, address, subtotal, items.length]);

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setLoggedIn(Boolean(user));
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
          if (p?.role === "b2b_approved") setIsB2b(true);
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

  const validateCheckout = (): string | null => {
    if (!customerName.trim() || !customerEmail.trim()) {
      return t("contactRequired");
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 8) {
      return t("phoneRequired");
    }
    if (orderType === "delivery") {
      if (!zipCode || !address) {
        return locale === "de" ? "PLZ und Adresse erforderlich" : "Posta kodu ve adres gerekli";
      }
      if (!deliveryDate) {
        return locale === "de" ? "Lieferdatum wählen" : "Teslimat tarihi seçin";
      }
      if (deliveryDate < earliestDeliveryDate) {
        return locale === "de"
          ? `Lieferung ab ${earliestDeliveryDate} möglich (Same-Day bis 12:00, Fenster ${DELIVERY_WINDOW_LABEL})`
          : `Teslimat en erken ${earliestDeliveryDate} (aynı gün için 12:00’ye kadar, saat ${DELIVERY_WINDOW_LABEL})`;
      }
      if (zone && !isDeliveryDayAllowed(zone, deliveryDate)) {
        return locale === "de"
          ? `Dieses Datum ist nicht möglich. Fenster: ${DELIVERY_WINDOW_LABEL}`
          : `Bu tarih uygun değil. Teslimat saati: ${DELIVERY_WINDOW_LABEL}`;
      }
      if (quote && !quote.minOrderMet) {
        return t("minOrderWarning", { amount: formatPrice(quote.minOrderAmount, locale) });
      }
      if (quote && !quote.withinRadius) {
        return isB2b ? t("deliveryTooFarB2b") : t("deliveryTooFar");
      }
    } else {
      if (!pickupDate || !pickupSlot) {
        return locale === "de" ? "Abholdatum und -zeit wählen" : "Alış tarihi ve saati seçin";
      }
      if (!isPickupDateAllowed(pickupDate)) {
        return locale === "de" ? "Abholung nur Mo–Sa möglich" : "Gel-al sadece Pzt–Cmt";
      }
      if (!availablePickupSlots.some((s) => s.label === pickupSlot)) {
        return locale === "de"
          ? "Abholzeit zu nah oder ungültig — bitte mindestens 1 Stunde im Voraus wählen."
          : "Gel-al saati çok yakın veya geçersiz — en az 1 saat sonrasını seçin.";
      }
      if (quote && !quote.minOrderMet) {
        return t("minOrderWarning", { amount: formatPrice(quote.minOrderAmount, locale) });
      }
    }
    return null;
  };

  const getOrderPayload = () => ({
    items,
    orderType,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    customerPhone: customerPhone.trim() || undefined,
    zipCode,
    address,
    deliveryDate: orderType === "delivery" ? deliveryDate || undefined : undefined,
    pickupDate: orderType === "click_collect" ? pickupDate || undefined : undefined,
    pickupSlot: orderType === "click_collect" ? pickupSlot || undefined : undefined,
    locale,
  });

  const handlePayPalSuccess = (orderNumber: string) => {
    clear();
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  };

  const validationMessage = validateCheckout();
  const checkoutValid = validationMessage === null;
  const paypalReady = paypalConfig.enabled && paypalConfig.ready !== false && Boolean(paypalConfig.clientId);
  const paypalDisabled = loading || !checkoutValid;
  const onlinePaymentEnabled = paypalReady || stripeConfig.enabled;
  const deliveryDateInvalid =
    orderType === "delivery" &&
    Boolean(deliveryDate) &&
    deliveryDate < earliestDeliveryDate;

  const openDatePicker = (el: HTMLInputElement | null) => {
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      // Bazı tarayıcılarda showPicker kısıtlı olabilir
    }
  };

  return (
    <div className="page-narrow py-6 sm:py-10 pb-32 sm:pb-10">
      <BeginCheckoutTracker value={subtotal} />
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-2 tracking-tight">{t("title")}</h1>
      <p className="text-sm text-bosporus-muted mb-6">
        {onlinePaymentEnabled
          ? paypalReady
            ? t("paymentNoteOnline")
            : t("paymentNoteOnlineStripeOnly")
          : t("noPaymentNote")}
      </p>

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
              placeholder={locale === "de" ? "+49 152 ..." : "+49 152 ..."}
              required
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
                  {zoneDisplayName(zone, locale)}
                  <br />
                  {formatDeliveryWindowHint(locale)}
                </p>
              )}
              {!zone && zipCode.length >= 4 && (
                <p className="text-xs text-bosporus-muted -mt-2">{formatDeliveryWindowHint(locale)}</p>
              )}
              <div>
                <Input
                  label={locale === "de" ? "Lieferdatum" : "Teslimat tarihi"}
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  onClick={(e) => openDatePicker(e.currentTarget)}
                  onFocus={(e) => openDatePicker(e.currentTarget)}
                  min={earliestDeliveryDate}
                  className="cursor-pointer"
                  error={deliveryDateInvalid ? t("invalidDeliveryDateShort") : undefined}
                />
                <p className="text-xs text-bosporus-muted mt-1">
                  {locale === "de"
                    ? `Lieferfenster: ${DELIVERY_WINDOW_LABEL}`
                    : `Teslimat saati: ${DELIVERY_WINDOW_LABEL}`}
                </p>
                {suggestedDeliveryDates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-bosporus-muted mb-2">{t("suggestedDeliveryDates")}</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedDeliveryDates.map((iso) => {
                        const active = deliveryDate === iso;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => setDeliveryDate(iso)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors",
                              active
                                ? "border-bosporus bg-bosporus text-white"
                                : "border-bosporus-gray-200 bg-white text-bosporus-gray-800 hover:border-bosporus/40"
                            )}
                          >
                            {formatDisplayDate(iso, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
                onClick={(e) => openDatePicker(e.currentTarget)}
                onFocus={(e) => openDatePicker(e.currentTarget)}
                min={new Date().toISOString().split("T")[0]}
                className="cursor-pointer"
              />
              <div>
                <label className="field-label">{t("pickupSlot")}</label>
                <select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)} className="field-input">
                  <option value="">—</option>
                  {availablePickupSlots.map((s) => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-bosporus-muted mt-1">
                  {locale === "de"
                    ? "Nur Termine ab jetzt + 1 Stunde"
                    : "Sadece şu andan en az 1 saat sonrası"}
                </p>
                {pickupDate && availablePickupSlots.length === 0 && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-2">
                    {locale === "de"
                      ? "Für dieses Datum keine Abholzeit mehr frei — bitte anderen Tag wählen."
                      : "Bu gün için uygun gel-al saati kalmadı — lütfen başka gün seçin."}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        {error && (
          <p className="text-bosporus-red text-sm bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
        )}

        {(paypalReady || stripeConfig.enabled) && (
          <Card>
            <h2 className="font-bold text-bosporus-gray-800 mb-2">{t("paymentSection")}</h2>
            <p className="text-sm text-bosporus-muted mb-4">
              {paypalReady ? t("paymentNoteOnline") : t("paymentNoteOnlineStripeOnly")}
            </p>
            {!checkoutValid && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                {validationMessage || t("completeDetailsHint")}
              </p>
            )}
            {paypalConfig.enabled && !paypalReady && (
              <p className="text-sm text-bosporus-muted bg-bosporus-gray-50 border border-bosporus-gray-100 rounded-xl px-3 py-2 mb-4">
                {t("paypalNotReady")}
              </p>
            )}
            <div className="space-y-4">
              {stripeConfig.enabled && (
                <StripeCheckout
                  disabled={paypalDisabled}
                  getPayload={getOrderPayload}
                  onError={(msg) => setError(msg)}
                />
              )}
              {paypalReady && paypalConfig.clientId && (
                <PayPalCheckout
                  clientId={paypalConfig.clientId}
                  mode={paypalConfig.mode ?? "live"}
                  disabled={paypalDisabled}
                  getPayload={getOrderPayload}
                  onError={(msg) => setError(msg)}
                  onSuccess={handlePayPalSuccess}
                />
              )}
            </div>
          </Card>
        )}

        <Card className="space-y-2 sm:hidden">
          <div className="flex justify-between text-sm text-bosporus-muted">
            <span>{locale === "de" ? "Warenwert" : "Ürünler"}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          {orderType === "delivery" && deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-bosporus-muted">
              <span>{locale === "de" ? "Liefergebühr" : "Teslimat ücreti"}</span>
              <span>{formatPrice(deliveryFee, locale)}</span>
            </div>
          )}
          {orderType === "delivery" && quote?.freeDelivery && (
            <div className="flex justify-between text-sm text-bosporus">
              <span>{t("deliveryFeeLabel")}</span>
              <span>
                {quote.freeReason === "first_order" ? t("freeDeliveryFirstOrder") : t("freeDelivery")}
              </span>
            </div>
          )}
          {orderType === "delivery" && !loggedIn && !isB2b && (
            <p className="text-xs text-bosporus-muted pt-1">
              {t("loginForFirstOrderFree")}{" "}
              <Link href="/register" className="text-bosporus font-semibold underline">
                {t("registerShort")}
              </Link>
            </p>
          )}
          <div className="flex justify-between items-center text-xl font-extrabold pt-2 border-t border-bosporus-gray-100">
            <span>{locale === "de" ? "Gesamt" : "Toplam"}</span>
            <span className="text-bosporus">{formatPrice(grandTotal, locale)}</span>
          </div>
        </Card>

        <Card className="hidden sm:block space-y-2">
          <div className="flex justify-between text-sm text-bosporus-muted">
            <span>{locale === "de" ? "Warenwert" : "Ürünler"}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          {orderType === "delivery" && deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-bosporus-muted">
              <span>{locale === "de" ? "Liefergebühr" : "Teslimat ücreti"}</span>
              <span>{formatPrice(deliveryFee, locale)}</span>
            </div>
          )}
          {orderType === "delivery" && quote?.freeDelivery && (
            <div className="flex justify-between text-sm text-bosporus">
              <span>{t("deliveryFeeLabel")}</span>
              <span>
                {quote.freeReason === "first_order" ? t("freeDeliveryFirstOrder") : t("freeDelivery")}
              </span>
            </div>
          )}
          {orderType === "delivery" && !loggedIn && !isB2b && (
            <p className="text-xs text-bosporus-muted pt-1">
              {t("loginForFirstOrderFree")}{" "}
              <Link href="/register" className="text-bosporus font-semibold underline">
                {t("registerShort")}
              </Link>
            </p>
          )}
          {orderType === "delivery" && loggedIn && firstOrderEligible && !quote?.freeDelivery && (
            <p className="text-xs text-bosporus font-medium pt-1">{t("firstOrderPendingAddress")}</p>
          )}
          <div className="flex justify-between items-center text-xl font-extrabold pt-2 border-t border-bosporus-gray-100">
            <span>{locale === "de" ? "Gesamt" : "Toplam"}</span>
            <span className="text-bosporus">{formatPrice(grandTotal, locale)}</span>
          </div>
        </Card>

        {!onlinePaymentEnabled && (
          <Button
            type="button"
            onClick={async () => {
              setError("");
              const validationError = validateCheckout();
              if (validationError) {
                setError(validationError);
                return;
              }
              setLoading(true);
              try {
                const res = await fetch("/api/orders/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(getOrderPayload()),
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
            }}
            loading={loading}
            size="lg"
            fullWidth
            className="hidden sm:flex"
          >
            {t("placeOrder")}
          </Button>
        )}
      </div>

      {/* Mobile sticky — sadece online ödeme yoksa klasik sipariş */}
      {!onlinePaymentEnabled && (
        <div className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4 pb-2">
          <Card padding="sm" className="!rounded-2xl shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-bosporus-muted font-medium">{locale === "de" ? "Gesamt" : "Toplam"}</p>
                <p className="text-xl font-extrabold text-bosporus">{formatPrice(grandTotal, locale)}</p>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  setError("");
                  const validationError = validateCheckout();
                  if (validationError) {
                    setError(validationError);
                    return;
                  }
                  setLoading(true);
                  try {
                    const res = await fetch("/api/orders/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(getOrderPayload()),
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
                }}
                loading={loading}
                size="lg"
                className="flex-1 max-w-[200px]"
              >
                {t("placeOrder")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
