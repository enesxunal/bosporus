"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getCategories, getProducts } from "@/lib/products";
import { ProductTable } from "@/components/b2b/ProductTable";
import { B2bHeader } from "@/components/b2b/B2bHeader";
import { B2bSidebar } from "@/components/b2b/B2bSidebar";
import { B2bOrderPanel } from "@/components/b2b/B2bOrderPanel";

const DEMO_B2B_PROFILE = {
  id: "demo",
  email: "demo@bosporus.de",
  role: "b2b_approved" as const,
  company_name: "Demo Restaurant GmbH",
  company_address: "Köln",
  vat_id: "DE123456789",
  vat_verified: true,
  locale: "de" as const,
};

function GewerbeContent() {
  const t = useTranslations("b2b");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? undefined;
  const [query, setQuery] = useState("");

  const categories = getCategories();
  const products = useMemo(
    () =>
      getProducts({
        search: query || undefined,
        category: categorySlug,
        limit: 80,
        activeOnly: true,
      }),
    [query, categorySlug]
  );

  return (
    <div className="min-h-screen bg-bosporus-gray-50 flex flex-col">
      <B2bHeader onSearch={setQuery} searchQuery={query} />
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex-1 w-full">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-metro-navy">{t("title")}</h1>
          <p className="text-sm text-bosporus-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <B2bSidebar
            categories={categories}
            locale={locale}
            activeSlug={categorySlug}
            productCount={products.length}
          />
          <div className="flex-1 min-w-0">
            <div className="mb-3 flex items-center justify-between text-sm text-bosporus-muted">
              <span>
                {products.length} {locale === "de" ? "Artikel" : "ürün"}
              </span>
              <span className="text-metro-navy bg-bosporus-yellow px-2 py-0.5 rounded-sm font-bold text-xs">
                NETTO
              </span>
            </div>
            <ProductTable products={products} profile={DEMO_B2B_PROFILE} />
          </div>
          <B2bOrderPanel />
        </div>
      </div>
      <footer className="border-t border-bosporus-gray-200 bg-metro-navy text-white/60 text-xs py-3 text-center mt-8">
        © {new Date().getFullYear()} Bosporus GmbH ·{" "}
        {locale === "de" ? "Nur für Gewerbekunden" : "Sadece kurumsal müşteriler"}
      </footer>
    </div>
  );
}

export default function GewerbePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bosporus-gray-50 flex items-center justify-center text-bosporus-muted">
          Laden…
        </div>
      }
    >
      <GewerbeContent />
    </Suspense>
  );
}
