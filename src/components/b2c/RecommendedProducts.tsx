"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/b2c/ProductCard";
import { getRecentProductSkus } from "@/lib/recent-products";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Loader2 } from "lucide-react";

interface RecommendedProductsProps {
  excludeSku: string;
  categorySlug?: string | null;
}

export function RecommendedProducts({ excludeSku, categorySlug }: RecommendedProductsProps) {
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recent = getRecentProductSkus().filter((s) => s !== excludeSku);
    const params = new URLSearchParams({ exclude: excludeSku });
    if (categorySlug) params.set("category", categorySlug);
    if (recent.length) params.set("recent", recent.join(","));

    fetch(`/api/catalog/recommendations?${params}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [excludeSku, categorySlug]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-bosporus" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-bosporus-gray-200">
      <SectionHeader
        title={locale === "de" ? "Das könnte Ihnen auch gefallen" : "Bunlar da ilginizi çekebilir"}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
