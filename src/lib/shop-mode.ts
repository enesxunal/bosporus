import type { UserProfile } from "./types";
import { isB2BApproved } from "./types";

/**
 * Geçici B2B-only mod: fiyatlar sadece onaylı toptancılara,
 * bireysel (B2C) kayıt ve sipariş kapalı.
 * İleride B2C yeniden açılınca false yapılır.
 */
export const B2B_ONLY_MODE = true;

/** Onaylı B2B müşteri (veya admin) fiyatları görebilir */
export function canSeePrices(profile: UserProfile | null | undefined): boolean {
  if (!B2B_ONLY_MODE) return true;
  if (profile?.role === "admin") return true;
  return isB2BApproved(profile ?? null);
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
