"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, Building2, Globe, User, Menu } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { HeaderSearch } from "@/components/b2c/HeaderSearch";
import { useState } from "react";

export function B2cHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCart((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = useState(false);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "de" ? "tr" : "de" });
  };

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top utility bar — Lidl blue strip */}
      <div className="bg-bosporus text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <span className="hidden sm:inline font-medium">
            Bosporus GmbH · Lebensmittel-Großhandel Köln
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/gewerbe" className="flex items-center gap-1 hover:text-bosporus-yellow transition-colors font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              {t("b2bPortal")}
            </Link>
            <button type="button" onClick={switchLocale} className="flex items-center gap-1 hover:text-bosporus-yellow">
              <Globe className="w-3.5 h-3.5" />
              {locale === "de" ? "TR" : "DE"}
            </button>
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="shrink-0">
            <Image src="/logo.svg" alt="Bosporus" width={130} height={44} className="h-9 w-auto" priority />
          </Link>

          <div className="hidden md:block flex-1 max-w-xl">
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/gewerbe/register"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-bosporus-gray-800 hover:text-bosporus border border-bosporus-gray-200 rounded-sm"
            >
              <User className="w-4 h-4" />
              {t("register")}
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-bosporus text-white text-sm font-bold rounded-sm hover:bg-bosporus-dark transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">{t("cart")}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-bosporus-red text-white text-xs min-w-[20px] h-5 px-1 rounded-sm flex items-center justify-center font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="md:hidden p-2 border border-bosporus-gray-200 rounded-sm"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-3">
          <HeaderSearch />
        </div>
      </div>

      {/* Category nav — Lidl horizontal strip */}
      <nav className="border-t border-bosporus-gray-200 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                pathname === link.href
                  ? "border-bosporus text-bosporus"
                  : "border-transparent text-bosporus-gray-800 hover:text-bosporus hover:border-bosporus-light"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products?filter=aktion"
            className="ml-auto px-4 py-2 text-sm font-bold text-bosporus-red bg-red-50 rounded-sm hover:bg-red-100"
          >
            % {locale === "de" ? "Aktionen" : "Kampanyalar"}
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <nav className="md:hidden border-t border-bosporus-gray-200 bg-white px-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-semibold border-b border-bosporus-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
