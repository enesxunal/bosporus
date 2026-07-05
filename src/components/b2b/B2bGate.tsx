"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, Lock, Clock } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function useB2bProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data as UserProfile);
      setLoading(false);
    });
  }, []);

  return { profile, loading, userId, isApproved: profile?.role === "b2b_approved", isPending: profile?.role === "b2b_pending" };
}

export function B2bGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, loading, userId, isApproved, isPending } = useB2bProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bosporus-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-metro-navy flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center !rounded-2xl">
          <Lock className="w-12 h-12 text-metro-navy mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-bosporus-gray-800 mb-2">Gewerbe-Portal</h1>
          <p className="text-bosporus-muted text-sm mb-6">
            Nettopreise sind nur für registrierte Gewerbekunden sichtbar.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button fullWidth size="lg">Anmelden</Button>
            </Link>
            <Link href="/register?tab=gewerbe">
              <Button fullWidth size="lg" variant="outline">
                Gewerbekonto beantragen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-metro-navy flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center !rounded-2xl">
          <Clock className="w-12 h-12 text-bosporus-yellow mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-bosporus-gray-800 mb-2">Freischaltung ausstehend</h1>
          <p className="text-bosporus-muted text-sm mb-2">
            Ihre Gewerbeanfrage für <strong>{profile?.company_name}</strong> wird geprüft.
          </p>
          <p className="text-bosporus-muted text-sm mb-6">
            Wir melden uns per E-Mail, sobald Ihr Konto freigeschaltet ist.
          </p>
          <Link href="/">
            <Button variant="outline" fullWidth>Zum Privat-Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-metro-navy flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center !rounded-2xl">
          <Lock className="w-12 h-12 text-bosporus-red mx-auto mb-4" />
          <h1 className="text-xl font-extrabold mb-2">Kein Zugang</h1>
          <p className="text-bosporus-muted text-sm mb-6">Ihr Konto hat keinen Gewerbe-Zugang.</p>
          <Link href="/register?tab=gewerbe">
            <Button fullWidth>Gewerbekonto beantragen</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
