"use client";

import { useTranslations, useLocale } from "next-intl";
import { Plus, ShoppingCart } from "lucide-react";
import type { Product, UserProfile } from "@/lib/types";
import { getDisplayPrice, formatUnit, formatPrice } from "@/lib/pricing";
import { netToGross, isPromoActive } from "@/lib/pricing";
import { getProductImageUrl, getAvailability } from "@/lib/category-images";
import { getProductName, productDetailHref } from "@/lib/product-display";
import { useCart } from "@/stores/cart";
import { useShopProfile } from "@/hooks/useShopProfile";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/b2c/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ProductCardProps {
  product: Product;
  profile?: UserProfile | null;
  variant?: "default" | "deal";
}

export function ProductCard({ product, profile: profileProp = null, variant = "default" }: ProductCardProps) {
  const t = useTranslations("product");
  const locale = useLocale() as "de" | "tr";
  const loadedProfile = useShopProfile();
  const profile = profileProp ?? loadedProfile;
  const addItem = useCart((s) => s.addItem);
  const displayPrice = getDisplayPrice(product, profile);
  const isDeal = isPromoActive(product) || variant === "deal";
  const name = getProductName(product, locale);
  const detailHref = productDetailHref(product.sku);
  const avail = getAvailability(product);
  const outOfStock = avail === "out_of_stock";
  const img = getProductImageUrl(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
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
      name,
      quantity: 1,
      unit: product.base_unit,
      priceNet: Math.round(net * 100) / 100,
      priceGross: Math.round(gross * 100) / 100,
      taxRate: product.tax_rate,
      imageUrl: img,
    });
  };

  return (
    <article className="group flex flex-col card card-hover overflow-hidden h-full">
      <Link href={detailHref} className="block relative">
        <div className="relative aspect-square bg-bosporus-gray-50 overflow-hidden">
          <ProductImage
            product={product}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {isDeal && (
            <div className="absolute top-2.5 left-2.5">
              <Badge variant="promo">{t("promo")}</Badge>
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-bosporus-red">
                {locale === "de" ? "Ausverkauft" : "Tükendi"}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <Link href={detailHref}>
          <h3 className="text-sm font-semibold text-bosporus-gray-800 line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-bosporus transition-colors">
            {name}
          </h3>
        </Link>
        <p className="text-xs text-bosporus-muted font-medium">
          {formatUnit(product.base_unit, locale)}
        </p>

        <div className="mt-auto pt-3 border-t border-bosporus-gray-100 space-y-3">
          <div>
            {displayPrice.isPromo && displayPrice.originalAmount != null && (
              <span className="text-xs text-bosporus-muted line-through block mb-0.5">
                {formatPrice(displayPrice.originalAmount, locale)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-2xl sm:text-[1.65rem] font-extrabold leading-none tracking-tight",
                  isDeal ? "text-bosporus-red" : "text-bosporus-gray-800"
                )}
              >
                {formatPrice(displayPrice.amount, locale)}
              </span>
            </div>
            <span className="text-[11px] text-bosporus-muted font-medium">
              {displayPrice.label === "brutto" ? t("brutto") : t("netto")}
            </span>
          </div>

          <Button type="button" onClick={handleAdd} fullWidth size="md" disabled={outOfStock}>
            <ShoppingCart className="w-4 h-4 sm:hidden" />
            <Plus className="w-4 h-4 hidden sm:block" />
            {outOfStock ? (locale === "de" ? "Ausverkauft" : "Tükendi") : t("addToCart")}
          </Button>
        </div>
      </div>
    </article>
  );
}
