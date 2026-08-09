import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearProductsCache } from "@/lib/products-db";
import {
  PAYMENT_TEST_PRODUCT_SEED,
  PAYMENT_TEST_SKU,
} from "@/lib/payment-test-product";

/**
 * One-shot: upsert PAYMENT-TEST-1EUR in production DB.
 * Protected by OPS_PAYMENT_TEST_TOKEN. Remove after use.
 */

function authorize(request: Request): boolean {
  const expected = process.env.OPS_PAYMENT_TEST_TOKEN;
  const got = request.headers.get("x-ops-token");
  return Boolean(expected && got && got === expected);
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("products")
    .select("id, sku, price_b2b, price_b2c, tax_rate, is_active, stock_status, updated_at")
    .eq("sku", PAYMENT_TEST_SKU)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    exists: Boolean(data),
    product: data,
    sku: PAYMENT_TEST_SKU,
  });
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const row = {
    ...PAYMENT_TEST_PRODUCT_SEED,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingErr } = await admin
    .from("products")
    .select("id, sku, price_b2b, price_b2c, is_active")
    .eq("sku", PAYMENT_TEST_SKU)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existing) {
    const { data, error } = await admin
      .from("products")
      .update(row)
      .eq("sku", PAYMENT_TEST_SKU)
      .select("id, sku, price_b2b, price_b2c, tax_rate, is_active, stock_status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, before: existing }, { status: 500 });
    }

    clearProductsCache();
    return NextResponse.json({
      ok: true,
      action: "updated",
      before: existing,
      product: data,
    });
  }

  const { data, error } = await admin
    .from("products")
    .insert(row)
    .select("id, sku, price_b2b, price_b2c, tax_rate, is_active, stock_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  clearProductsCache();
  return NextResponse.json({
    ok: true,
    action: "inserted",
    product: data,
  });
}
