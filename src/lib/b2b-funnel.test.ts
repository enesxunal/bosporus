import { describe, expect, it } from "vitest";
import {
  buildApprovalUpdate,
  recordAccountApproved,
  recordB2bFunnelEvent,
  recordBeginCheckout,
  recordFirstLoginAfterApproval,
  recordMinOrderBlocked,
  recordPurchase,
  sanitizeFunnelMetadata,
} from "./b2b-funnel-server";
import { parseClientFunnelAction } from "./b2b-funnel-request";
import { safeLoginNext } from "./b2b-funnel-shared";
import { summarizeDistinctUsers } from "./b2b-funnel-admin";
import { isB2BApproved } from "./types";
import { templateB2bApproved } from "./email/templates";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

function createFakeAdmin(profile?: {
  role: string;
  vat_verified: boolean;
  approved_at: string | null;
}) {
  const inserts: Record<string, unknown>[] = [];
  const unique = new Set<string>();

  const admin = {
    from(table: string) {
      if (table === "profiles") {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return { data: profile ?? null, error: profile ? null : { code: "PGRST116" } };
                  },
                };
              },
            };
          },
        };
      }

      return {
        async insert(row: Record<string, unknown>) {
          const key = `${row.user_id}:${row.event_name}:${row.dedupe_key}`;
          if (row.dedupe_key && unique.has(key)) return { error: { code: "23505" } };
          if (row.dedupe_key) unique.add(key);
          inserts.push(row);
          return { error: null };
        },
      };
    },
  };

  return { admin: admin as never, inserts };
}

describe("B2B funnel approval/login", () => {
  it("approval aynı update içinde approved_at + gate alanlarını set eder", () => {
    const at = "2026-08-15T00:00:00.000Z";
    expect(buildApprovalUpdate(at)).toEqual({
      role: "b2b_approved",
      vat_verified: true,
      approved_at: at,
    });
  });

  it("approve eventi unique dedupe ile bir kez yazılır", async () => {
    const { admin, inserts } = createFakeAdmin();
    const first = await recordAccountApproved({
      userId: USER_ID,
      approvedAt: "2026-08-15T00:00:00.000Z",
      admin,
    });
    const second = await recordAccountApproved({
      userId: USER_ID,
      approvedAt: "2026-08-15T00:00:00.000Z",
      admin,
    });

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true, duplicate: true });
    expect(inserts).toHaveLength(1);
  });

  it("approval sonrası ilk login eventi bir kez yazılır", async () => {
    const { admin, inserts } = createFakeAdmin({
      role: "b2b_approved",
      vat_verified: true,
      approved_at: new Date(Date.now() - 7_200_000).toISOString(),
    });

    const first = await recordFirstLoginAfterApproval(USER_ID, admin);
    const second = await recordFirstLoginAfterApproval(USER_ID, admin);

    expect(first.recorded).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.metadata).toMatchObject({ hours_since_approval: 2 });
  });
});

describe("B2B funnel commerce security", () => {
  it("pending/B2C approved sayılmaz ve begin checkout üretmez", async () => {
    expect(isB2BApproved({ role: "b2b_pending", vat_verified: true })).toBe(false);
    expect(isB2BApproved({ role: "b2b_approved", vat_verified: false })).toBe(false);

    const result = await recordBeginCheckout({
      userId: USER_ID,
      isApprovedB2b: false,
      subtotal: 500,
      orderType: "delivery",
    });
    expect(result.recorded).toBe(false);
  });

  it("approved view ve add-to-cart eventleri güvenli metadata ile yazılır", async () => {
    const { admin, inserts } = createFakeAdmin();
    await recordB2bFunnelEvent({
      userId: USER_ID,
      eventName: "approved_b2b_view_item",
      metadata: { product_id: PRODUCT_ID, price_bucket: "0-99" },
      admin,
    });
    await recordB2bFunnelEvent({
      userId: USER_ID,
      eventName: "approved_b2b_add_to_cart",
      metadata: {
        product_id: PRODUCT_ID,
        quantity: 2,
        cart_subtotal_bucket: "100-249",
      },
      admin,
    });
    expect(inserts.map((row) => row.event_name)).toEqual([
      "approved_b2b_view_item",
      "approved_b2b_add_to_cart",
    ]);
  });

  it("min-order blocked doğru bucket, limit, tip ve segmenti yazar", async () => {
    const { admin, inserts } = createFakeAdmin();
    await recordMinOrderBlocked({
      userId: USER_ID,
      isApprovedB2b: true,
      subtotal: 420,
      minRequired: 500,
      orderType: "click_collect",
      admin,
    });
    expect(inserts[0]?.metadata).toEqual({
      subtotal_bucket: "250-499",
      min_required: 500,
      order_type: "click_collect",
      segment: "approved",
    });

  });

  it("approved begin-checkout eventi üretir", async () => {
    const { admin, inserts } = createFakeAdmin();
    await recordBeginCheckout({
      userId: USER_ID,
      isApprovedB2b: true,
      subtotal: 550,
      orderType: "delivery",
      admin,
    });
    expect(inserts[0]?.event_name).toBe("approved_b2b_begin_checkout");
  });

  it("gerçek purchase yazılır; PAYMENT-TEST-1EUR purchase tamamen atlanır", async () => {
    const { admin, inserts } = createFakeAdmin();
    await recordPurchase({
      userId: USER_ID,
      isApprovedB2b: true,
      orderId: "real-order",
      value: 550,
      paymentMethod: "stripe",
      orderType: "delivery",
      isPaymentTestOrder: false,
      admin,
    });
    expect(inserts).toHaveLength(1);

    const testResult = await recordPurchase({
      userId: USER_ID,
      isApprovedB2b: true,
      orderId: "test-order",
      value: 1,
      paymentMethod: "stripe",
      orderType: "click_collect",
      isPaymentTestOrder: true,
      admin,
    });
    expect(testResult.recorded).toBe(false);
  });

  it("client başka user/event adı gönderemez", () => {
    expect(
      parseClientFunnelAction({
        eventName: "approved_b2b_purchase",
        userId: "victim",
      })
    ).toBeNull();

    expect(
      parseClientFunnelAction({
        action: "view_item",
        productId: PRODUCT_ID,
        userId: "victim",
        eventName: "approved_b2b_purchase",
      })
    ).toEqual({ action: "view_item", productId: PRODUCT_ID });
  });

  it("raw PII ve tanımsız metadata anahtarları drop edilir", () => {
    const clean = sanitizeFunnelMetadata(
      "approved_b2b_add_to_cart",
      {
        product_id: PRODUCT_ID,
        quantity: 1,
        cart_subtotal_bucket: "0-99",
        email: "customer@example.com",
        phone: "+491234",
        company_name: "Private GmbH",
      } as never
    );
    expect(clean).toEqual({
      product_id: PRODUCT_ID,
      quantity: 1,
      cart_subtotal_bucket: "0-99",
    });
  });

  it("login deep-link yalnız izinli hedeflere gider", () => {
    expect(safeLoginNext("/quick-order")).toBe("/quick-order");
    expect(safeLoginNext("//evil.example")).toBe("/products");
  });

  it("approval email satış CTA ve şartları içerir", () => {
    const { html } = templateB2bApproved({ companyName: "Test", locale: "de" });
    expect(html).toContain("/login?next=/quick-order");
    expect(html).toContain("/login?next=/products");
    expect(html).toContain("500 €");
    expect(html).toContain("erste Lieferung ist kostenlos");
  });

  it("admin funnel event sayısı değil distinct user sayar", () => {
    expect(
      summarizeDistinctUsers([
        { user_id: "u1", event_name: "approved_b2b_add_to_cart" },
        { user_id: "u1", event_name: "approved_b2b_add_to_cart" },
        { user_id: "u2", event_name: "approved_b2b_add_to_cart" },
        { user_id: "u1", event_name: "approved_b2b_purchase" },
      ])
    ).toMatchObject({ addToCart: 2, purchase: 1 });
  });
});
