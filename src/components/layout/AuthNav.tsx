"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { User, LogOut, LayoutDashboard, ChevronDown, Loader2 } from "lucide-react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";

type AuthNavVariant = "b2c" | "b2b";

export function AuthNav({ variant = "b2c" }: { variant?: AuthNavVariant }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const isAdmin = auth?.isAdmin ?? false;
  const loading = auth?.loading ?? false;
  const signOut = auth?.signOut;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    if (signOut) await signOut();
    router.push("/");
    router.refresh();
  };

  const isB2b = variant === "b2b";
  const iconBtnClass = cn(
    "relative flex items-center justify-center h-10 w-10 rounded-xl transition-colors",
    isB2b ? "text-white/90 hover:bg-white/10" : "text-bosporus-gray-800 hover:bg-bosporus-light hover:text-bosporus"
  );

  const menuClass = cn(
    "absolute right-0 top-full mt-2 z-[60] min-w-[200px] rounded-2xl border shadow-lg py-1.5 overflow-hidden",
    isB2b ? "bg-metro-navy border-white/10 text-white" : "bg-white border-bosporus-gray-200 text-bosporus-gray-800"
  );

  const itemClass = cn(
    "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-left transition-colors",
    isB2b ? "hover:bg-white/10" : "hover:bg-bosporus-light"
  );

  if (!user && !loading) {
    if (isB2b) {
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
          className="hidden sm:flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl text-sm font-bold text-white bg-bosporus hover:bg-bosporus-dark shadow-[var(--shadow-btn)] transition-all active:scale-[0.98] whitespace-nowrap"
        >
          {t("register")}
        </Link>
      </div>
    );
  }

  const accountHref = isAdmin ? "/admin" : "/account";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={iconBtnClass}
        aria-label={t("account")}
        aria-expanded={open}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin opacity-70" />
        ) : (
          <User className="w-5 h-5" />
        )}
        {user && isAdmin && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-bosporus-yellow rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className={menuClass}>
          {loading ? (
            <p className={cn("px-4 py-3 text-sm", isB2b ? "text-white/60" : "text-bosporus-muted")}>
              …
            </p>
          ) : user ? (
            <>
              {user.email && (
                <p className={cn("px-4 py-2 text-xs truncate border-b", isB2b ? "text-white/50 border-white/10" : "text-bosporus-muted border-bosporus-gray-100")}>
                  {user.email}
                </p>
              )}
              <Link href={accountHref} className={itemClass} onClick={() => setOpen(false)}>
                {isAdmin ? <LayoutDashboard className="w-4 h-4 shrink-0" /> : <User className="w-4 h-4 shrink-0" />}
                {isAdmin ? "Admin Panel" : t("account")}
              </Link>
              {isAdmin && (
                <Link href="/" className={itemClass} onClick={() => setOpen(false)}>
                  <User className="w-4 h-4 shrink-0" />
                  {t("home")}
                </Link>
              )}
              <button type="button" className={cn(itemClass, "text-bosporus-red")} onClick={handleLogout}>
                <LogOut className="w-4 h-4 shrink-0" />
                {t("logout")}
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
