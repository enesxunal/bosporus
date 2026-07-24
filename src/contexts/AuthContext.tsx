"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import { isB2BApproved } from "@/lib/types";

interface AuthContextValue {
  user: SupabaseUser | null;
  isAdmin: boolean;
  /** Her girişli kullanıcının profili (rol dahil) */
  profile: UserProfile | null;
  /** Sadece onaylı B2B (fiyat / nettopreis) */
  b2bProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [b2bProfile, setB2bProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setIsAdmin(false);
      setProfile(null);
      setB2bProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setProfile(null);
        setB2bProfile(null);
        return;
      }

      const { data: row } = await supabase
        .from("profiles")
        .select("id, email, role, company_name, company_address, vat_id, vat_verified, locale, first_name, last_name")
        .eq("id", currentUser.id)
        .single();

      const p = (row as UserProfile | null) ?? null;
      setProfile(p);
      setIsAdmin(p?.role === "admin");
      setB2bProfile(p && isB2BApproved(p) ? p : null);
    } catch {
      setUser(null);
      setIsAdmin(false);
      setProfile(null);
      setB2bProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      loadSession();
    });

    return () => subscription.unsubscribe();
  }, [loadSession]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await createClient().auth.signOut();
    }
    setUser(null);
    setIsAdmin(false);
    setProfile(null);
    setB2bProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin, profile, b2bProfile, loading, signOut }),
    [user, isAdmin, profile, b2bProfile, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** AuthProvider dışında güvenli kullanım (opsiyonel) */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
