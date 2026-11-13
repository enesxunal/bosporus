"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/b2c/ProductCard";
import { getRecentProductSkus } from "@/lib/recent-products";
import type { Product } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function RecentlyViewedProducts() {
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const recent = getRecentProductSkus().slice(0, 6);
    if (recent.length === 0) return;
    const controller = new AbortController();
    const qs = new URLSearchParams({ recent: recent.join(",") });
    void fetch(`/api/catalog/recommendations?${qs}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((result: { products?: Product[] }) => {
        if (controller.signal.aborted) return;
        const bySku = new Map((result.products ?? []).map((p) => [p.sku, p]));
        // Never mislabel random recommendations as browsing history.
        setProducts(recent.map((sku) => bySku.get(sku)).filter((p): p is Product => Boolean(p)));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 bg-bosporus-gray-50">
      <div className="page-container">
        <SectionHeader title={locale === "de" ? "Zuletzt angesehen" : "Son görüntülediğiniz ürünler"} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
