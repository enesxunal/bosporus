export type UserRole = "b2c" | "b2b_pending" | "b2b_approved";
export type OrderType = "delivery" | "click_collect";
export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type BaseUnit = "kg" | "piece" | "box" | "palette";
export type Locale = "de" | "tr";

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name_de: string;
  name_tr: string | null;
  category_slug: string | null;
  category_name_de?: string;
  category_name_tr?: string;
  image_url: string | null;
  base_unit: BaseUnit;
  tax_rate: number;
  price_b2c: number;
  price_b2b: number;
  promo_price: number | null;
  promo_from: string | null;
  promo_to: string | null;
  is_active: boolean;
  stock_status: string;
}

export interface Category {
  id: string;
  slug: string;
  name_de: string;
  name_tr: string | null;
  sort_order: number;
  product_count?: number;
}

export interface DeliveryZone {
  id: string;
  name_de: string;
  name_tr: string | null;
  zip_prefixes: string[];
  min_order_amount: number;
  delivery_days: number[];
}

export interface PickupSlot {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unit: BaseUnit;
  priceNet: number;
  priceGross: number;
  taxRate: number;
  imageUrl?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  company_name: string | null;
  company_address: string | null;
  vat_id: string | null;
  vat_verified: boolean;
  locale: Locale;
}

export function isB2BApproved(profile: UserProfile | null): boolean {
  return profile?.role === "b2b_approved" && profile.vat_verified;
}
