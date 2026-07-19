"use client";

import { useAuthOptional } from "@/contexts/AuthContext";
import type { UserProfile } from "@/lib/types";

/** Shop AuthProvider yoksa (ör. /gewerbe) null döner; çökmez. */
export function useShopProfile(): UserProfile | null {
  return useAuthOptional()?.b2bProfile ?? null;
}
