"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/b2c/ProductCard";
import { Button } from "@/components/ui/Button";
import { isPromoActive } from "@/lib/pricing";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 48;

interface ProductGridProps {
  category?: string;
  search?: string;
  filter?: string;
}

export function ProductGrid({ category, search, filter }: ProductGridProps) {
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
      <p className="text-sm text-bosporus-muted mb-4">
        {products.length} / {total} {locale === "de" ? "Artikel" : "ürün"}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant={isPromoActive(p) ? "deal" : "default"} />
        ))}
      </div>
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
