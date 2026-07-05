"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { User, LogOut, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/cn";

type AuthNavVariant = "b2c" | "b2b";

export function AuthNav({ variant = "b2c" }: { variant?: AuthNavVariant }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single();
        setIsAdmin(data?.role === "admin");
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAdmin(data?.role === "admin");
      } else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    setUser(null);
    router.refresh();
    router.push(variant === "b2b" ? "/gewerbe" : "/");
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    t("account");

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-bosporus-muted hidden sm:block" />;
  }

  if (user) {
    const accountHref = isAdmin ? "/admin" : "/account";
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href={accountHref}
          className={cn(
            "hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-semibold transition-colors max-w-[120px]",
            variant === "b2b"
              ? "text-white/90 hover:bg-white/10"
              : "text-bosporus-gray-800 hover:bg-bosporus-light hover:text-bosporus"
          )}
          title={user.email}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAdmin ? "Admin" : displayName}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-xl transition-colors",
            variant === "b2b" ? "text-white/80 hover:bg-white/10" : "text-bosporus-muted hover:bg-bosporus-gray-100"
          )}
          aria-label={t("logout")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (variant === "b2b") {
    return (
      <Link
        href="/login"
        className="hidden md:flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold border border-white/30 hover:bg-white/10"
      >
        <User className="w-4 h-4" />
        {t("login")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="flex items-center justify-center h-10 px-3 sm:px-4 rounded-xl text-sm font-semibold text-bosporus-gray-800 hover:bg-bosporus-gray-100 transition-colors whitespace-nowrap"
      >
        {t("login")}
      </Link>
      <Link
        href="/register"
        className="flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl text-sm font-bold text-white bg-bosporus hover:bg-bosporus-dark shadow-[var(--shadow-btn)] transition-all active:scale-[0.98] whitespace-nowrap"
      >
        <User className="w-4 h-4 hidden xs:inline" />
        {t("register")}
      </Link>
    </div>
  );
}
