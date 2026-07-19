export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

export function getPayPalClientId(): string | null {
  return process.env.PAYPAL_CLIENT_ID?.trim() ?? null;
}

export function getPayPalMode(): "live" | "sandbox" {
  return process.env.PAYPAL_MODE?.trim().toLowerCase() === "sandbox" ? "sandbox" : "live";
}

function apiBase(): string {
  return getPayPalMode() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

function parsePayPalErrorMessage(raw: string): string {
  try {
    const data = JSON.parse(raw) as {
      error?: string;
      message?: string;
      details?: { issue?: string; description?: string }[];
    };
    if (data.error === "invalid_client") {
      return "PAYPAL_AUTH_FAILED";
    }
    const detail = data.details?.[0];
    if (detail?.description) return detail.description;
    if (data.message) return data.message;
    if (data.error) return data.error;
  } catch {
    // not JSON
  }
  return "PAYPAL_ERROR";
}

export async function verifyPayPalConnection(): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("invalid_client") || msg.includes("PAYPAL_AUTH_FAILED")) {
      return { ok: false, code: "PAYPAL_AUTH_FAILED" };
    }
    return { ok: false, code: "PAYPAL_ERROR" };
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET!.trim();
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parsePayPalErrorMessage(err));
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(amountEur: number): Promise<string> {
  const token = await getAccessToken();
  const value = amountEur.toFixed(2);

  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value,
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parsePayPalErrorMessage(err));
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<{ captureId: string; amount: number }> {
  const token = await getAccessToken();

  const res = await fetch(`${apiBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parsePayPalErrorMessage(err));
  }

  const data = (await res.json()) as {
    status: string;
    purchase_units?: {
      payments?: {
        captures?: { id: string; amount?: { value: string } }[];
      };
    }[];
  };

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (data.status !== "COMPLETED" || !capture?.id) {
    throw new Error("PayPal capture incomplete");
  }

  return {
    captureId: capture.id,
    amount: Number(capture.amount?.value ?? 0),
  };
}

export async function refundPayPalCapture(
  captureId: string,
  reason = "ORDER_FULFILLMENT_FAILED"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await getAccessToken();
    const res = await fetch(`${apiBase()}/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note_to_payer: reason.slice(0, 255),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("PayPal refund failed:", err);
      return { ok: false, error: parsePayPalErrorMessage(err) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "REFUND_FAILED";
    console.error("PayPal refund error:", e);
    return { ok: false, error: msg };
  }
}
