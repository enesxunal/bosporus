"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/b2c/ProductCard";
import { ProductTable } from "@/components/b2b/ProductTable";
import { Button } from "@/components/ui/Button";
import { isPromoActive } from "@/lib/pricing";
import { useShopProfile } from "@/hooks/useShopProfile";
import { Loader2, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 48;
const VIEW_KEY = "bosporus-catalog-view";
type ViewMode = "list" | "grid";

interface ProductGridProps {
  category?: string;
  search?: string;
  filter?: string;
}

export function ProductGrid({ category, search, filter }: ProductGridProps) {
  const locale = useLocale();
  const t = useTranslations("b2b");
  const profile = useShopProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "grid") setView(saved);
      else {
        // eski gewerbe tercihi
        const legacy = localStorage.getItem("bosporus-b2b-view");
        if (legacy === "list" || legacy === "grid") setView(legacy);
      }
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

  const load = useCallback(
    async (fromOffset: number, append: boolean) => {
      if (fromOffset === 0) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(fromOffset) });
      if (category) params.set("category", category);
      if (search) params.set("q", search);
      if (filter) params.set("filter", filter);

      const res = await fetch(`/api/catalog/products?${params}`);
      const data = await res.json();

      setProducts((prev) => (append ? [...prev, ...(data.products ?? [])] : data.products ?? []));
      setTotal(data.total ?? 0);
      setOffset(fromOffset + (data.products?.length ?? 0));
      setLoading(false);
      setLoadingMore(false);
    },
    [category, search, filter]
  );

  useEffect(() => {
    setOffset(0);
    load(0, false);
  }, [load]);

  const hasMore = products.length < total;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-bosporus-muted text-lg">
          {locale === "de" ? "Keine Produkte gefunden." : "Ürün bulunamadı."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-bosporus-muted">
          {products.length} / {total} {locale === "de" ? "Artikel" : "ürün"}
        </p>
        <div className="flex items-center gap-1 p-1 bg-bosporus-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title={t("viewListHint")}
            aria-pressed={view === "list"}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold rounded-lg transition-colors",
              view === "list"
                ? "bg-white text-bosporus shadow-sm"
                : "text-bosporus-muted hover:text-bosporus-gray-800"
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">{t("viewList")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title={t("viewGridHint")}
            aria-pressed={view === "grid"}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold rounded-lg transition-colors",
              view === "grid"
                ? "bg-white text-bosporus shadow-sm"
                : "text-bosporus-muted hover:text-bosporus-gray-800"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">{t("viewGrid")}</span>
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ProductTable products={products} profile={profile} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} profile={profile} variant={isPromoActive(p) ? "deal" : "default"} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" size="lg" onClick={() => load(offset, true)} disabled={loadingMore}>
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : locale === "de" ? (
              "Mehr laden"
            ) : (
              "Daha fazla yükle"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
