"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, Building2, Globe, Menu, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { HeaderSearch } from "@/components/b2c/HeaderSearch";
import { AuthNav } from "@/components/layout/AuthNav";
import { getCategories } from "@/lib/products";
import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";

const HEADER_CATEGORY_LIMIT = 12;

export function B2cHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCart((s) => s.totalItems());
  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = useMemo(() => getCategories().slice(0, HEADER_CATEGORY_LIMIT), []);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "de" ? "tr" : "de" });
  };

  const categoryLabel = (nameDe: string, nameTr: string | null) =>
    locale === "tr" && nameTr ? nameTr : nameDe;

  const isCategoryActive = (slug: string) => pathname === `/products/${slug}`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-bosporus-gray-200 shadow-sm">
      <div className="bg-bosporus text-white text-xs">
        <div className="page-container py-2 flex justify-between items-center">
          <span className="hidden sm:inline font-medium opacity-90">
            Bosporus GmbH · Köln
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/gewerbe"
              className="flex items-center gap-1.5 hover:text-bosporus-yellow transition-colors font-semibold"
            >
              <Building2 className="w-3.5 h-3.5" />
              {t("b2bPortal")}
            </Link>
            <button
              type="button"
              onClick={switchLocale}
              className="flex items-center gap-1 hover:text-bosporus-yellow font-semibold"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === "de" ? "TR" : "DE"}
            </button>
          </div>
        </div>
      </div>

      <div className="page-container py-3">
        <div className="flex items-center gap-3 lg:gap-6">
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/logo.svg"
              alt="Bosporus"
              width={170}
              height={57}
              className="h-10 sm:h-11 md:h-12 lg:h-[52px] w-auto"
              priority
            />
          </Link>

          <div className="hidden md:block flex-1 max-w-xl">
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <AuthNav />
            <Link
              href="/cart"
              className={cn(
                "relative hidden md:flex items-center gap-2 px-4 h-11",
                "bg-bosporus text-white text-sm font-bold rounded-xl",
                "hover:bg-bosporus-dark active:scale-[0.98] transition-all",
                "shadow-[var(--shadow-btn)]"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{t("cart")}</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-bosporus-red text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="md:hidden touch-target flex items-center justify-center rounded-xl border border-bosporus-gray-200 bg-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="md:hidden mt-3">
          <HeaderSearch />
        </div>
      </div>

      <nav className="border-t border-bosporus-gray-100 bg-white hidden md:block">
        <div className="page-container flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
          <Link
            href="/products?filter=aktion"
            className="shrink-0 px-3 py-2 mr-1 text-sm font-bold text-bosporus-red bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            % {locale === "de" ? "Aktionen" : "Kampanyalar"}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products/${cat.slug}`}
              className={cn(
                "shrink-0 px-3 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors",
                isCategoryActive(cat.slug)
                  ? "bg-bosporus text-white"
                  : "text-bosporus-gray-800 hover:bg-bosporus-light hover:text-bosporus"
              )}
            >
              {categoryLabel(cat.name_de, cat.name_tr)}
            </Link>
          ))}
          <Link
            href="/products"
            className={cn(
              "shrink-0 px-3 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors",
              pathname === "/products" ? "text-bosporus bg-bosporus-light" : "text-bosporus-muted hover:text-bosporus"
            )}
          >
            {locale === "de" ? "Alle →" : "Tümü →"}
          </Link>
        </div>
      </nav>

      {mobileOpen && (
        <nav className="md:hidden border-t border-bosporus-gray-200 bg-white max-h-[70vh] overflow-y-auto">
          <Link
            href="/products?filter=aktion"
            className="block px-4 py-3.5 text-sm font-bold text-bosporus-red bg-red-50 border-b border-bosporus-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            % {locale === "de" ? "Aktionen" : "Kampanyalar"}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products/${cat.slug}`}
              className={cn(
                "block px-4 py-3.5 text-sm font-semibold border-b border-bosporus-gray-100",
                isCategoryActive(cat.slug) ? "text-bosporus bg-bosporus-light" : ""
              )}
              onClick={() => setMobileOpen(false)}
            >
              {categoryLabel(cat.name_de, cat.name_tr)}
              <span className="text-bosporus-muted font-normal ml-1">({cat.product_count})</span>
            </Link>
          ))}
          <Link
            href="/products"
            className="block px-4 py-3.5 text-sm font-semibold text-bosporus border-b border-bosporus-gray-100"
            onClick={() => setMobileOpen(false)}
          >
            {locale === "de" ? "Alle Produkte" : "Tüm ürünler"}
          </Link>
          <Link
            href="/contact"
            className="block px-4 py-3.5 text-sm text-bosporus-muted"
            onClick={() => setMobileOpen(false)}
          >
            {t("contact")}
          </Link>
        </nav>
      )}
    </header>
  );
}
