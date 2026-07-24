"use client";

import { useAuthOptional } from "@/contexts/AuthContext";
import type { UserProfile } from "@/lib/types";
import { canSeePrices } from "@/lib/shop-mode";

/** Fiyat gösterebilecek profil (onaylı B2B / admin); yoksa null. */
export function useShopProfile(): UserProfile | null {
  const auth = useAuthOptional();
  if (!auth) return null;
  if (auth.b2bProfile) return auth.b2bProfile;
  if (canSeePrices(auth.profile)) return auth.profile;
  return null;
}
