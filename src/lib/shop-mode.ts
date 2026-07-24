import type { UserProfile } from "./types";
import { isB2BApproved } from "./types";

/**
 * B2B-only işletme modu:
 * - Bireysel kayıt / sipariş kapalı
 * - Ödeme sadece onaylı toptancı
 * - Fiyatlar herkese açık (Google Merchant / ürün trafiği için)
 */
export const B2B_ONLY_MODE = true;

/** Fiyatlar herkese görünsün (Merchant Center uyumu) */
export const PUBLIC_PRICES = true;

/** Fiyat görünürlüğü */
export function canSeePrices(_profile?: UserProfile | null): boolean {
  if (PUBLIC_PRICES) return true;
  if (!B2B_ONLY_MODE) return true;
  if (_profile?.role === "admin") return true;
  return isB2BApproved(_profile ?? null);
}

/** Sipariş / ödeme sadece onaylı B2B */
export function canCheckout(profile: UserProfile | null | undefined): boolean {
  if (!B2B_ONLY_MODE) return true;
  return isB2BApproved(profile ?? null);
}

/** B2C kayıt kapalı mı */
export function isB2cRegistrationClosed(): boolean {
  return B2B_ONLY_MODE;
}
