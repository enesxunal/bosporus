"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MapPin, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COMPANY } from "@/lib/company";
import { formatPrice } from "@/lib/pricing";
import { trackWhatsAppClick } from "@/lib/analytics";
import { isValidGermanPlz, normalizeGermanPlz } from "@/lib/delivery-check";
import { cn } from "@/lib/cn";

type CheckResult = {
  zipCode: string;
  status: "serviceable" | "out_of_range" | "uncertain";
  serviceable: boolean;
  zoneNameDe: string | null;
  zoneNameTr: string | null;
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  deliveryFeeEstimate: number | null;
  pickupAvailable: boolean;
  pickupOpen: string;
  pickupClose: string;
};

function waHref(message: string): string {
  const digits = COMPANY.whatsappPhone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function DeliveryPlzChecker() {
  const t = useTranslations("deliveryCheck");
  const locale = useLocale() as "de" | "tr";
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const cleaned = normalizeGermanPlz(zip);
    if (!isValidGermanPlz(cleaned)) {
      setError(t("invalidPlz"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/catalog/delivery-check?zipCode=${encodeURIComponent(cleaned)}`
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "INVALID_PLZ") setError(t("invalidPlz"));
        else if (data.error === "RATE_LIMITED") setError(t("rateLimited"));
        else setError(t("checkFailed"));
        return;
      }
      setResult(data as CheckResult);
    } catch {
      setError(t("checkFailed"));
    } finally {
      setLoading(false);
    }
  };

  const zoneName =
    result &&
    (locale === "tr" ? result.zoneNameTr : result.zoneNameDe);

  const waMessage = t("whatsappMessage", {
    zip: result?.zipCode || normalizeGermanPlz(zip) || "—",
  });

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold text-bosporus-gray-800" htmlFor="plz">
          {t("plzLabel")}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="plz"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            autoComplete="postal-code"
            placeholder={t("placeholder")}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="sm:max-w-[10rem] text-lg tracking-wider"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "plz-error" : undefined}
          />
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {t("cta")}
          </Button>
        </div>
        {error && (
          <p id="plz-error" className="text-sm font-medium text-bosporus-red" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <div
          className={cn(
            "rounded-2xl border p-4 sm:p-5 space-y-3",
            result.status === "serviceable"
              ? "border-green-200 bg-green-50/60"
              : "border-amber-200 bg-amber-50/50"
          )}
        >
          <p className="font-bold text-bosporus-gray-800 text-lg">
            {result.status === "serviceable"
              ? t("resultOk")
              : result.status === "out_of_range"
                ? t("resultOutOfRange")
                : t("resultUncertain")}
          </p>

          {result.status === "serviceable" && (
            <ul className="text-sm text-bosporus-gray-800 space-y-1.5">
              {zoneName && (
                <li>
                  <span className="text-bosporus-muted">{t("zoneLabel")}: </span>
                  <strong>{zoneName}</strong>
                </li>
              )}
              <li>
                <span className="text-bosporus-muted">{t("minOrderLabel")}: </span>
                <strong>{formatPrice(result.minOrderAmount, locale)}</strong>
              </li>
              {result.deliveryFeeEstimate != null && (
                <li>
                  <span className="text-bosporus-muted">{t("feeLabel")}: </span>
                  <strong>
                    {result.deliveryFeeEstimate === 0
                      ? t("feeFree")
                      : formatPrice(result.deliveryFeeEstimate, locale)}
                  </strong>
                </li>
              )}
              {result.freeDeliveryThreshold != null && (
                <li>
                  <span className="text-bosporus-muted">{t("freeFromLabel")}: </span>
                  <strong>{formatPrice(result.freeDeliveryThreshold, locale)}</strong>
                </li>
              )}
              <li className="text-bosporus-muted pt-1">{t("checkoutNote")}</li>
            </ul>
          )}

          {(result.status === "uncertain" || result.status === "out_of_range") && (
            <p className="text-sm text-bosporus-gray-800 leading-relaxed">{t("contactHint")}</p>
          )}

          {result.pickupAvailable && (
            <div className="flex items-start gap-2 pt-2 border-t border-black/5">
              <Package className="w-4 h-4 mt-0.5 text-bosporus shrink-0" />
              <p className="text-sm text-bosporus-gray-800">
                <strong>{t("pickupOk")}</strong>
                <span className="block text-bosporus-muted mt-0.5">
                  {t("pickupHours", {
                    open: result.pickupOpen,
                    close: result.pickupClose,
                  })}
                </span>
              </p>
            </div>
          )}

          {(result.status === "uncertain" || result.status === "out_of_range") && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={waHref(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick("delivery_check")}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-bold rounded-xl bg-[#25D366] text-white hover:opacity-95"
              >
                {t("whatsappCta")}
              </a>
              <a
                href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-bold rounded-xl border border-bosporus-gray-200 text-bosporus-gray-800 hover:bg-white"
              >
                <Phone className="w-4 h-4" />
                {COMPANY.phone}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
