"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CategoryNavProps {
  categories: Category[];
  locale: string;
  activeSlug?: string;
}

export function CategoryNav({ categories, locale, activeSlug }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 md:top-[var(--header-offset)] z-30 bg-white/95 backdrop-blur-md border-b border-bosporus-gray-200 shadow-sm">
      <div className="page-container">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          <Link
            href="/products"
            className={cn(
              "shrink-0 px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all",
              pathname === "/products" && !activeSlug
                ? "bg-bosporus text-white shadow-[var(--shadow-btn)]"
                : "bg-bosporus-gray-50 text-bosporus-gray-800 hover:bg-bosporus-light"
            )}
          >
            {locale === "de" ? "Alle" : "Tümü"}
          </Link>
          {categories.map((cat) => {
            const name = locale === "tr" && cat.name_tr ? cat.name_tr : cat.name_de;
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/products/${cat.slug}`}
                className={cn(
                  "shrink-0 px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all",
                  isActive
                    ? "bg-bosporus text-white shadow-[var(--shadow-btn)]"
                    : "bg-bosporus-gray-50 text-bosporus-gray-800 hover:bg-bosporus-light"
                )}
              >
                {name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
