import type { CartItem, Product } from "./types";
import { getAvailability } from "./category-images";
import { grossToNet, isPromoActive, netToGross } from "./pricing";
import {
  findZoneInList,
  getWeekdayFromDate,
  isDeliveryDayAllowed,
  isPickupDateAllowed,
  loadDeliveryZones,
  loadPickupSlots,
} from "./delivery-data";
import { quoteDelivery } from "./delivery-pricing";
import { fetchProductsForOrder } from "./products-db";
import { createAdminClient } from "./supabase/admin";

const PRICE_TOLERANCE = 0.03;

export function buildValidatedCartLine(
  product: Product,
  quantity: number,
  isB2b: boolean
): CartItem | { error: string } {
  if (!product.is_active) {
    return { error: `PRODUCT_INACTIVE:${product.sku}` };
  }
  if (getAvailability(product) === "out_of_stock") {
    return { error: `PRODUCT_UNAVAILABLE:${product.sku}` };
  }
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999) {
    return { error: `INVALID_QUANTITY:${product.sku}` };
  }

  const promo = isPromoActive(product);
  let priceNet: number;
  let priceGross: number;

  if (isB2b) {
    priceNet = promo && product.promo_price ? product.promo_price : product.price_b2b;
    if (priceNet <= 0) return { error: `NO_B2B_PRICE:${product.sku}` };
    priceGross = netToGross(priceNet, product.tax_rate);
  } else {
    priceGross = promo && product.promo_price
      ? netToGross(product.promo_price, product.tax_rate)
      : product.price_b2c;
    if (priceGross <= 0) return { error: `NO_B2C_PRICE:${product.sku}` };
    priceNet = grossToNet(priceGross, product.tax_rate);
  }

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name_de,
    quantity,
    unit: product.base_unit,
    priceNet: Math.round(priceNet * 100) / 100,
    priceGross: Math.round(priceGross * 100) / 100,
    taxRate: product.tax_rate,
    imageUrl: product.image_url,
  };
}

function linesMatch(a: CartItem, b: CartItem): boolean {
  return (
    Math.abs(a.priceNet - b.priceNet) <= PRICE_TOLERANCE &&
    Math.abs(a.priceGross - b.priceGross) <= PRICE_TOLERANCE &&
    a.quantity === b.quantity &&
    a.sku === b.sku
  );
}

export async function validateAndPriceOrderItems(
  clientItems: CartItem[],
  isB2b: boolean
): Promise<{ ok: true; items: CartItem[] } | { ok: false; error: string }> {
  const ids = [...new Set(clientItems.map((i) => i.productId).filter(Boolean))];
  const skus = [...new Set(clientItems.map((i) => i.sku).filter(Boolean))];

  const products = await fetchProductsForOrder(ids, skus);
  const byId = new Map(products.map((p) => [p.id, p]));
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const validated: CartItem[] = [];

  for (const clientItem of clientItems) {
    const product = byId.get(clientItem.productId) ?? bySku.get(clientItem.sku);
    if (!product) return { ok: false, error: `UNKNOWN_PRODUCT:${clientItem.sku}` };

    const built = buildValidatedCartLine(product, clientItem.quantity, isB2b);
    if ("error" in built) return { ok: false, error: built.error };

    if (!linesMatch(clientItem, built)) {
      return { ok: false, error: "PRICE_MISMATCH" };
    }

    validated.push(built);
  }

  return { ok: true, items: validated };
}

export async function validateDeliveryOrder(params: {
  zipCode?: string;
  address?: string;
  deliveryDate?: string;
  totalGross: number;
  isB2b?: boolean;
}): Promise<
  | { ok: true; deliveryFee: number; distanceKm: number | null; totalGross: number }
  | { ok: false; error: string }
> {
  if (!params.zipCode?.trim() || !params.deliveryDate) {
    return { ok: false, error: "DELIVERY_FIELDS_REQUIRED" };
  }

  const quote = await quoteDelivery({
    orderType: "delivery",
    isB2b: params.isB2b ?? false,
    subtotalGross: params.totalGross,
    zipCode: params.zipCode,
    address: params.address,
  });

  if (!quote.minOrderMet) {
    return { ok: false, error: "MIN_ORDER_NOT_MET" };
  }
  if (!quote.withinRadius) {
    return params.isB2b
      ? { ok: false, error: "DELIVERY_DISTANCE_EXCEEDED_B2B" }
      : { ok: false, error: "DELIVERY_DISTANCE_EXCEEDED" };
  }
  if (quote.distanceKm == null) {
    return { ok: false, error: "DELIVERY_ADDRESS_UNKNOWN" };
  }

  const zones = await loadDeliveryZones();
  const zone = findZoneInList(zones, params.zipCode);
  if (zone && !isDeliveryDayAllowed(zone, params.deliveryDate)) {
    return { ok: false, error: "DELIVERY_DAY_INVALID" };
  }
  if (!zone) {
    const wd = getWeekdayFromDate(params.deliveryDate);
    if (wd === 0) return { ok: false, error: "DELIVERY_DAY_INVALID" };
  }

  return {
    ok: true,
    deliveryFee: quote.deliveryFee,
    distanceKm: quote.distanceKm,
    totalGross: quote.totalGross,
  };
}

export async function validatePickupOrder(params: {
  pickupDate?: string;
  pickupSlot?: string;
  totalGross: number;
  isB2b?: boolean;
}): Promise<{ ok: true; slotId?: string } | { ok: false; error: string }> {
  if (!params.pickupDate || !params.pickupSlot) {
    return { ok: false, error: "PICKUP_FIELDS_REQUIRED" };
  }
  if (!isPickupDateAllowed(params.pickupDate)) {
    return { ok: false, error: "PICKUP_DAY_INVALID" };
  }

  const quote = await quoteDelivery({
    orderType: "click_collect",
    isB2b: params.isB2b ?? false,
    subtotalGross: params.totalGross,
  });
  if (!quote.minOrderMet) {
    return { ok: false, error: "MIN_ORDER_NOT_MET" };
  }

  const slots = await loadPickupSlots();
  const weekday = getWeekdayFromDate(params.pickupDate);
  const slot = slots.find((s) => s.weekday === weekday && s.label === params.pickupSlot);
  if (!slot) return { ok: false, error: "PICKUP_SLOT_INVALID" };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_NOT_CONFIGURED" };

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("pickup_date", params.pickupDate)
    .eq("pickup_slot_label", params.pickupSlot)
    .neq("status", "cancelled");

  const maxOrders = await getSlotMaxOrders(weekday, params.pickupSlot);
  if (maxOrders > 0 && (count ?? 0) >= maxOrders) {
    return { ok: false, error: "PICKUP_SLOT_FULL" };
  }

  return { ok: true, slotId: slot.id.startsWith("fallback-") ? undefined : slot.id };
}

async function getSlotMaxOrders(weekday: number, label: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 10;

  const parts = label.split("–").map((s) => s.trim());
  const start = parts[0]?.length === 5 ? `${parts[0]}:00` : null;
  if (!start) return 10;

  const { data } = await admin
    .from("pickup_slots")
    .select("max_orders")
    .eq("weekday", weekday)
    .eq("start_time", start)
    .maybeSingle();

  return data?.max_orders ? Number(data.max_orders) : 10;
}

export function stripB2bPrice(product: Product): Product {
  return { ...product, price_b2b: 0 };
}
