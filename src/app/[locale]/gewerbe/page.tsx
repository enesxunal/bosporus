"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getCategories } from "@/lib/products";
import type { Product } from "@/lib/types";
import { ProductTable } from "@/components/b2b/ProductTable";
import { ProductCard } from "@/components/b2c/ProductCard";
import { B2bHeader } from "@/components/b2b/B2bHeader";
import { B2bSidebar } from "@/components/b2b/B2bSidebar";
import { B2bOrderPanel } from "@/components/b2b/B2bOrderPanel";
import { B2bGate, useB2bProfile } from "@/components/b2b/B2bGate";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

const VIEW_KEY = "bosporus-b2b-view";
type ViewMode = "list" | "grid";

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
  const [view, setView] = useState<ViewMode>("list");

  const categories = getCategories();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "grid") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ limit: "80" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (categorySlug) params.set("category", categorySlug);
    fetch(`/api/catalog/products?${params}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        if (!cancelled) setProducts(Array.isArray(d.products) ? d.products : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
            <div className="mb-3 flex items-center justify-between gap-3 text-sm text-bosporus-muted">
              <span>{t("productCount", { count: products.length })}</span>
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex rounded-lg border border-bosporus-gray-200 bg-white p-0.5"
                  role="group"
                  aria-label={locale === "de" ? "Ansicht" : "Görünüm"}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title={t("viewListHint")}
                    aria-pressed={view === "list"}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      view === "list"
                        ? "bg-metro-navy text-white"
                        : "text-bosporus-muted hover:text-metro-navy"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("viewList")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title={t("viewGridHint")}
                    aria-pressed={view === "grid"}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      view === "grid"
                        ? "bg-metro-navy text-white"
                        : "text-bosporus-muted hover:text-metro-navy"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("viewGrid")}</span>
                  </button>
                </div>
                <span className="text-metro-navy bg-bosporus-yellow px-2 py-0.5 rounded-lg font-bold text-xs">
                  NETTO
                </span>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-sm border border-bosporus-gray-200">
                <p className="text-bosporus-muted">{t("noProducts")}</p>
              </div>
            ) : view === "list" ? (
              <ProductTable products={products} profile={profile} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} profile={profile} />
                ))}
              </div>
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
