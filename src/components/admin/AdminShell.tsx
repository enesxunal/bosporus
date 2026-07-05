"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Building2,
  Mail,
  LogOut,
  Loader2,
  Menu,
  X,
  FolderTree,
  Truck,
  Globe,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const NAV = [
    { href: "/admin", icon: LayoutDashboard, label: t("overview"), exact: true },
    { href: "/admin/products", icon: ShoppingBag, label: t("products") },
    { href: "/admin/categories", icon: FolderTree, label: t("categories") },
    { href: "/admin/orders", icon: Package, label: t("orders") },
    { href: "/admin/customers", icon: Users, label: t("customers") },
    { href: "/admin/b2b", icon: Building2, label: t("b2b") },
    { href: "/admin/delivery", icon: Truck, label: t("delivery") },
    { href: "/admin/emails", icon: Mail, label: t("emails") },
  ];

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/login");
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        router.replace("/");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    });
  }, [router]);

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bosporus-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "de" ? "tr" : "de" });
  };

  return (
    <div className="min-h-screen bg-bosporus-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-metro-navy text-white shrink-0">
        <div className="p-5 border-b border-white/10">
          <h1 className="font-extrabold text-lg">Bosporus Admin</h1>
          <p className="text-white/50 text-xs mt-1">{t("panel")}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                isActive(href, exact) ? "bg-bosporus-yellow text-metro-navy" : "text-white/80 hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={switchLocale}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white w-full rounded-lg hover:bg-white/5 transition-colors"
            title={t("language")}
          >
            <Globe className="w-4 h-4" />
            {t("language")}: {locale === "de" ? "TR" : "DE"}
          </button>
          <Link href="/" className="block px-4 py-2 text-sm text-white/60 hover:text-white">
            {t("toShop")}
          </Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white w-full">
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-metro-navy text-white sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="font-bold">Admin</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={switchLocale}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20"
              >
                <Globe className="w-3.5 h-3.5" />
                {locale === "de" ? "TR" : "DE"}
              </button>
              <button type="button" onClick={() => setMobileNav(!mobileNav)} className="p-2">
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {mobileNav && (
            <nav className="px-3 pb-3 space-y-1">
              {NAV.map(({ href, icon: Icon, label, exact }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNav(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold",
                    isActive(href, exact) ? "bg-bosporus-yellow text-metro-navy" : "text-white/80"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
