"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { Category } from "@/lib/types";

interface CategoryNavProps {
  categories: Category[];
  locale: string;
  activeSlug?: string;
}

export function CategoryNav({ categories, locale, activeSlug }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-[var(--header-offset,120px)] z-40 bg-white border-b border-bosporus-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          <Link
            href="/products"
            className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-sm whitespace-nowrap ${
              pathname === "/products" && !activeSlug
                ? "bg-bosporus text-white"
                : "bg-bosporus-gray-50 text-bosporus-gray-800 hover:bg-bosporus-light"
            }`}
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
                className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-sm whitespace-nowrap ${
                  isActive
                    ? "bg-bosporus text-white"
                    : "bg-bosporus-gray-50 text-bosporus-gray-800 hover:bg-bosporus-light"
                }`}
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
