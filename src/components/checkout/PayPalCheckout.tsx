"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useTranslations, useLocale } from "next-intl";
import type { CartItem } from "@/lib/types";

interface PayPalCheckoutProps {
  clientId: string;
  mode: "live" | "sandbox";
  disabled?: boolean;
  getPayload: () => {
    items: CartItem[];
    orderType: "delivery" | "click_collect";
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    zipCode?: string;
    address?: string;
    deliveryDate?: string;
    pickupDate?: string;
    pickupSlot?: string;
    locale: "de" | "tr";
  };
  onError: (message: string) => void;
  onSuccess: (orderNumber: string) => void;
}

export function PayPalCheckout({
  clientId,
  mode,
  disabled,
  getPayload,
  onError,
  onSuccess,
}: PayPalCheckoutProps) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "de" | "tr";

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "EUR",
        intent: "capture",
        locale: locale === "de" ? "de_DE" : "en_US",
        ...(mode === "sandbox" ? { "data-sdk-integration-source": "integrationbuilder" } : {}),
      }}
    >
      <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "paypal" }}
          disabled={disabled}
          createOrder={async () => {
            const payload = getPayload();
            if (!payload.customerName.trim() || !payload.customerEmail.trim()) {
              onError(t("contactRequired"));
              throw new Error("validation");
            }

            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: payload.items,
                orderType: payload.orderType,
                zipCode: payload.zipCode,
                deliveryDate: payload.deliveryDate,
                pickupDate: payload.pickupDate,
                pickupSlot: payload.pickupSlot,
              }),
            });

            const data = await res.json();
            if (!res.ok) {
              onError(data.error ?? t("paypalError"));
              throw new Error(data.error ?? "create failed");
            }
            return data.paypalOrderId as string;
          }}
          onApprove={async (data) => {
            const payload = getPayload();
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paypalOrderId: data.orderID,
                ...payload,
              }),
            });
            const result = await res.json();
            if (!res.ok) {
              onError(result.error ?? t("paypalError"));
              throw new Error(result.error ?? "capture failed");
            }
            onSuccess(result.orderNumber as string);
          }}
          onError={() => {
            onError(t("paypalError"));
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
