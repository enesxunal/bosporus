"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import { isB2BApproved } from "@/lib/types";

export function useShopProfile(): UserProfile | null {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, email, role, company_name, company_address, vat_id, vat_verified, locale")
        .eq("id", user.id)
        .single();
      if (data && isB2BApproved(data as UserProfile)) {
        setProfile(data as UserProfile);
      }
    });
  }, []);

  return profile;
}
