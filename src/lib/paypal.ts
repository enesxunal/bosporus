export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

export function getPayPalClientId(): string | null {
  return process.env.PAYPAL_CLIENT_ID?.trim() ?? null;
}

function apiBase(): string {
  return process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
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
    throw new Error(`PayPal auth failed: ${err}`);
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
    throw new Error(`PayPal create order failed: ${err}`);
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
    throw new Error(`PayPal capture failed: ${err}`);
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
