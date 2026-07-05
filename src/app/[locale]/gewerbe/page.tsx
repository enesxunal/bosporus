"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getCategories } from "@/lib/products";
import type { Product } from "@/lib/types";
import { ProductTable } from "@/components/b2b/ProductTable";
import { B2bHeader } from "@/components/b2b/B2bHeader";
import { B2bSidebar } from "@/components/b2b/B2bSidebar";
import { B2bOrderPanel } from "@/components/b2b/B2bOrderPanel";
import { B2bGate, useB2bProfile } from "@/components/b2b/B2bGate";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2 } from "lucide-react";

function GewerbeContent() {
  const t = useTranslations("b2b");
  const locale = useLocale();
  const { profile } = useB2bProfile();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? undefined;
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = getCategories();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "80" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (categorySlug) params.set("category", categorySlug);
    fetch(`/api/catalog/products?${params}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [debouncedQuery, categorySlug]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-bosporus-gray-50 flex flex-col">
      <B2bHeader onSearch={setQuery} searchQuery={query} profile={profile} />
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex-1 w-full">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-metro-navy">{t("title")}</h1>
          <p className="text-sm text-bosporus-muted">
            {profile.company_name} · {profile.vat_id}
          </p>
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
              <span>{t("productCount", { count: products.length })}</span>
              <span className="text-metro-navy bg-bosporus-yellow px-2 py-0.5 rounded-lg font-bold text-xs">
                NETTO
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-sm border border-bosporus-gray-200">
                <p className="text-bosporus-muted">{t("noProducts")}</p>
              </div>
            ) : (
              <ProductTable products={products} profile={profile} />
            )}
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
    <B2bGate>
      <Suspense
        fallback={
          <div className="min-h-screen bg-bosporus-gray-50 flex items-center justify-center text-bosporus-muted">
            Laden…
          </div>
        }
      >
        <GewerbeContent />
      </Suspense>
    </B2bGate>
  );
}
