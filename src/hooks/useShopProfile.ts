"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/lib/types";

export function useShopProfile(): UserProfile | null {
  const { b2bProfile } = useAuth();
  return b2bProfile;
}
