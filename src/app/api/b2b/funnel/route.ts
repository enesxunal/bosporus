import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { amountBucket } from "@/lib/b2b-funnel-shared";
import { recordB2bFunnelEvent } from "@/lib/b2b-funnel-server";
import { rateLimit } from "@/lib/rate-limit";
import { parseClientFunnelAction } from "@/lib/b2b-funnel-request";
import { isB2BApproved } from "@/lib/types";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limited = rateLimit(`b2b-funnel:${auth.user.id}`, 180, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role, vat_verified")
    .eq("id", auth.user.id)
    .single();

  if (!isB2BApproved(profile)) {
    return NextResponse.json({ ok: true, recorded: false });
  }

  let body: ReturnType<typeof parseClientFunnelAction>;
  try {
    body = parseClientFunnelAction(await request.json());
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  if (!body) return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });

  if (body.action === "quick_order") {
    const result = await recordB2bFunnelEvent({
      userId: auth.user.id,
      eventName: "quick_order_used",
      metadata: { lines_added: body.linesAdded },
    });
    return NextResponse.json({ ok: result.ok, recorded: result.ok });
  }

  const { data: product } = await auth.supabase
    .from("products")
    .select("id, price_b2b, promo_price")
    .eq("id", body.productId)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }

  if (body.action === "view_item") {
    const dateKey = new Date().toISOString().slice(0, 10);
    const price = Number(product.promo_price ?? product.price_b2b ?? 0);
    const result = await recordB2bFunnelEvent({
      userId: auth.user.id,
      eventName: "approved_b2b_view_item",
      metadata: {
        product_id: product.id,
        price_bucket: amountBucket(price),
      },
      dedupeKey: `product:${product.id}:${dateKey}`,
    });
    return NextResponse.json({
      ok: result.ok,
      recorded: result.ok && !result.duplicate,
    });
  }

  const result = await recordB2bFunnelEvent({
    userId: auth.user.id,
    eventName: "approved_b2b_add_to_cart",
    metadata: {
      product_id: product.id,
      quantity: body.quantity,
      cart_subtotal_bucket: body.cartSubtotalBucket,
    },
  });
  return NextResponse.json({ ok: result.ok, recorded: result.ok });
}
