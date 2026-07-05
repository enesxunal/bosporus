"use client";

import { useTranslations, useLocale } from "next-intl";
import { Plus } from "lucide-react";
import type { Product, UserProfile } from "@/lib/types";
import { getDisplayPrice, formatUnit, formatPrice } from "@/lib/pricing";
import { netToGross, isPromoActive } from "@/lib/pricing";
import { useCart } from "@/stores/cart";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/b2c/ProductImage";

interface ProductCardProps {
  product: Product;
  profile?: UserProfile | null;
  variant?: "default" | "deal";
}

export function ProductCard({ product, profile = null, variant = "default" }: ProductCardProps) {
  const t = useTranslations("product");
  const locale = useLocale() as "de" | "tr";
  const addItem = useCart((s) => s.addItem);
  const displayPrice = getDisplayPrice(product, profile);
  const isDeal = isPromoActive(product) || variant === "deal";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const net =
      displayPrice.label === "netto"
        ? displayPrice.amount
        : displayPrice.amount / (1 + product.tax_rate / 100);
    const gross =
      displayPrice.label === "brutto"
        ? displayPrice.amount
        : netToGross(displayPrice.amount, product.tax_rate);

    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name_de,
      quantity: 1,
      unit: product.base_unit,
      priceNet: Math.round(net * 100) / 100,
      priceGross: Math.round(gross * 100) / 100,
      taxRate: product.tax_rate,
      imageUrl: product.image_url,
    });
  };

  return (
    <article className="group flex flex-col bg-white border border-bosporus-gray-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow h-full">
      <Link href={`/products/${product.category_slug ?? "all"}`} className="block relative">
        <div className="relative aspect-square bg-bosporus-gray-100 overflow-hidden">
          <ProductImage product={product} className="object-cover group-hover:scale-105 transition-transform duration-300" />
          {isDeal && (
            <span className="absolute top-2 left-2 bg-bosporus-red text-white text-xs font-bold px-2 py-1 rounded-sm uppercase">
              {t("promo")}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-3 gap-2">
        <Link href={`/products/${product.category_slug ?? "all"}`}>
          <h3 className="text-sm font-medium text-bosporus-gray-800 line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-bosporus">
            {product.name_de}
          </h3>
        </Link>
        <p className="text-xs text-bosporus-muted">
          {formatUnit(product.base_unit, locale)}
        </p>
        {/* Lidl-style big price */}
        <div className="mt-auto pt-2 border-t border-bosporus-gray-100">
          <div className="flex items-end justify-between gap-2">
            <div>
              {displayPrice.isPromo && displayPrice.originalAmount != null && (
                <span className="text-sm text-bosporus-muted line-through block">
                  {formatPrice(displayPrice.originalAmount, locale)}
                </span>
              )}
              <span className={`text-2xl font-bold leading-none ${isDeal ? "text-bosporus-red" : "text-bosporus-gray-800"}`}>
                {formatPrice(displayPrice.amount, locale)}
              </span>
              <span className="text-xs text-bosporus-muted block mt-0.5">
                {displayPrice.label === "brutto" ? t("brutto") : t("netto")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-bosporus text-white text-xs font-bold rounded-sm hover:bg-bosporus-dark transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("addToCart")}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
