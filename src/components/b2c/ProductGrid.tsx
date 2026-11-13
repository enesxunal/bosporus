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
import { type CatalogSort } from "@/lib/catalog-search";

const PAGE_SIZE = 48;
const VIEW_KEY = "bosporus-catalog-view";
type ViewMode = "list" | "grid";

interface ProductGridProps {
  category?: string;
  search?: string;
  filter?: string;
  // First 48 crawlable links are rendered in the server HTML.
  initialProducts?: Product[];
  initialTotal?: number;
}

export function ProductGrid({
  category,
  search,
  filter,
  initialProducts,
  initialTotal,
}: ProductGridProps) {
  const locale = useLocale();
  const t = useTranslations("b2b");
  const profile = useShopProfile();
  const [sort, setSort] = useState<CatalogSort>("name_asc");
  const hasInitial = initialProducts !== undefined && initialTotal !== undefined && sort === "name_asc";
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [offset, setOffset] = useState(initialProducts?.length ?? 0);
  const [loading, setLoading] = useState(!hasInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(VIEW_KEY);
        if (saved === "list" || saved === "grid") setView(saved);
        else {
          const legacy = localStorage.getItem("bosporus-b2b-view");
          if (legacy === "list" || legacy === "grid") setView(legacy);
        }
      } catch {
        /* ignore */
      }
    });
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
      params.set("sort", sort);

      const res = await fetch(`/api/catalog/products?${params}`);
      const data = await res.json();

      setProducts((prev) => (append ? [...prev, ...(data.products ?? [])] : data.products ?? []));
      setTotal(data.total ?? 0);
      setOffset(fromOffset + (data.products?.length ?? 0));
      setLoading(false);
      setLoadingMore(false);
    },
    [category, search, filter, sort]
  );

  useEffect(() => {
    if (!hasInitial) queueMicrotask(() => { void load(0, false); });
  }, [load, hasInitial]);

  const changeSort = (value: CatalogSort) => {
    setSort(value);
    if (value === "name_asc" && initialProducts && initialTotal !== undefined) {
      setProducts(initialProducts);
      setTotal(initialTotal);
      setOffset(initialProducts.length);
      setLoading(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs font-semibold text-bosporus-muted">
            {locale === "de" ? "Sortieren:" : "Sırala:"}
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => changeSort(e.target.value as CatalogSort)}
            className="rounded-lg border border-bosporus-gray-200 bg-white px-3 py-2 text-sm font-semibold text-bosporus-gray-800"
          >
            <option value="name_asc">{locale === "de" ? "Name A–Z" : "Ad A–Z"}</option>
            <option value="name_desc">{locale === "de" ? "Name Z–A" : "Ad Z–A"}</option>
            <option value="price_asc">{locale === "de" ? "Preis aufsteigend" : "Fiyat artan"}</option>
            <option value="price_desc">{locale === "de" ? "Preis absteigend" : "Fiyat azalan"}</option>
          </select>
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
