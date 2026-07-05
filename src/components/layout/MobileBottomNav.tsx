"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const HIDDEN_ON = ["/checkout", "/gewerbe", "/admin"];

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const cartCount = useCart((s) => s.totalItems());
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const items = [
    { href: "/", icon: Home, label: locale === "de" ? "Start" : "Ana Sayfa" },
    { href: "/products", icon: LayoutGrid, label: t("products") },
    { href: "/cart", icon: ShoppingCart, label: t("cart"), badge: cartCount },
    {
      href: loggedIn ? "/account" : "/login",
      icon: User,
      label: loggedIn ? t("account") : t("login"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-bosporus-gray-200 shadow-[0_-4px_20px_rgb(0_0_0/0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-4 h-16">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                active ? "text-bosporus" : "text-bosporus-muted"
              )}
            >
              <span className="relative">
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-bosporus-red text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold leading-none">{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-bosporus rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
