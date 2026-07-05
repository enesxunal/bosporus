"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Category } from "@/lib/types";
import { ChevronRight } from "lucide-react";

interface B2bSidebarProps {
  categories: Category[];
  locale: string;
  activeSlug?: string;
  productCount?: number;
}

export function B2bSidebar({ categories, locale, activeSlug, productCount }: B2bSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("b2b");

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="bg-white border border-bosporus-gray-200 rounded-sm overflow-hidden sticky top-32">
        <div className="bg-metro-navy text-white px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            {locale === "de" ? "Sortiment" : "Ürün grupları"}
          </h2>
          {productCount != null && (
            <p className="text-xs text-white/60 mt-0.5">{t("productCount", { count: productCount })}</p>
          )}
        </div>
        <nav className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <Link
            href="/gewerbe"
            className={`flex items-center justify-between px-4 py-2.5 text-sm border-b border-bosporus-gray-100 hover:bg-bosporus-gray-50 ${
              pathname === "/gewerbe" && !activeSlug ? "bg-bosporus-light font-semibold text-bosporus border-l-4 border-l-bosporus" : ""
            }`}
          >
            {t("allProducts")}
            <ChevronRight className="w-3.5 h-3.5 text-bosporus-muted" />
          </Link>
          <Link
            href="/order/track"
            className="flex items-center justify-between px-4 py-2 text-xs text-bosporus-muted border-b border-bosporus-gray-100 hover:bg-bosporus-gray-50"
          >
            {t("trackOrder")}
            <ChevronRight className="w-3 h-3" />
          </Link>
          {categories.map((cat) => {
            const name = locale === "tr" && cat.name_tr ? cat.name_tr : cat.name_de;
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/gewerbe?category=${cat.slug}`}
                className={`flex items-center justify-between px-4 py-2 text-sm border-b border-bosporus-gray-100 hover:bg-bosporus-gray-50 ${
                  isActive ? "bg-bosporus-light font-semibold text-bosporus border-l-4 border-l-bosporus" : "text-bosporus-gray-800"
                }`}
              >
                <span className="truncate">{name}</span>
                <span className="text-xs text-bosporus-muted shrink-0 ml-1">{cat.product_count}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
