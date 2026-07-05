"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Search, ShoppingCart, MapPin, Globe } from "lucide-react";
import { AuthNav } from "@/components/layout/AuthNav";
import { useCart } from "@/stores/cart";
import type { UserProfile } from "@/lib/types";

interface B2bHeaderProps {
  onSearch: (q: string) => void;
  searchQuery: string;
  profile?: UserProfile;
}

export function B2bHeader({ onSearch, searchQuery, profile }: B2bHeaderProps) {
  const t = useTranslations("b2b");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCart((s) => s.totalItems());

  return (
    <header className="bg-metro-navy text-white sticky top-0 z-50 shadow-lg">
      <div className="border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 py-1.5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-white/70">
              <MapPin className="w-3.5 h-3.5" />
              Bosporus Köln · Von Hünefeld Str. 2
            </span>
            <span className="hidden md:inline text-bosporus-yellow font-semibold">
              {locale === "de" ? "Nettopreise für Gewerbekunden" : "Kurumsal net fiyatlar"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/70 hover:text-white flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {locale === "de" ? "Privat-Shop" : "Bireysel mağaza"}
            </Link>
            <button
              type="button"
              onClick={() => router.replace(pathname, { locale: locale === "de" ? "tr" : "de" })}
              className="text-white/70 hover:text-white"
            >
              {locale === "de" ? "TR" : "DE"}
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/gewerbe" className="shrink-0 flex items-center">
          <Image
            src="/logo.svg"
            alt="Bosporus"
            width={150}
            height={49}
            className="h-9 sm:h-10 md:h-11 w-auto brightness-0 invert"
          />
        </Link>
        <div className="flex-1 relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-bosporus-gray-800 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-bosporus-yellow"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {profile && (
            <div className="hidden lg:block text-right text-xs">
              <p className="text-white/80 font-semibold truncate max-w-[160px]">{profile.company_name}</p>
              <p className="text-bosporus-yellow font-mono text-xs">{profile.vat_id}</p>
            </div>
          )}
          <AuthNav variant="b2b" />
          <Link
            href="/cart"
            className="flex items-center gap-2 px-4 py-2 bg-bosporus-yellow text-metro-navy font-bold text-sm rounded-sm hover:bg-bosporus-yellow-dark"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{nav("cart")}</span>
            {cartCount > 0 && (
              <span className="bg-metro-navy text-white text-xs px-1.5 py-0.5 rounded-sm font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
