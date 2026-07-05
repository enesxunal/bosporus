"use client";

import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/types";
import { getDisplayPrice, formatPrice, formatUnit, netToGross, isPromoActive } from "@/lib/pricing";
import { getProductImageUrl, getAvailability } from "@/lib/category-images";
import { getProductName } from "@/lib/product-display";
import { useCart } from "@/stores/cart";
import { useShopProfile } from "@/hooks/useShopProfile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import Image from "next/image";

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const t = useTranslations("product");
  const locale = useLocale() as "de" | "tr";
  const profile = useShopProfile();
  const addItem = useCart((s) => s.addItem);
  const displayPrice = getDisplayPrice(product, profile);
  const isDeal = isPromoActive(product);
  const avail = getAvailability(product);
  const name = getProductName(product, locale);
  const img = getProductImageUrl(product);
  const outOfStock = avail === "out_of_stock";

  const handleAdd = () => {
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

  const stockLabel =
    avail === "out_of_stock"
      ? locale === "de"
        ? "Nicht verfügbar"
        : "Tükendi"
      : avail === "limited"
        ? locale === "de"
          ? "Begrenzt verfügbar"
          : "Sınırlı stok"
        : locale === "de"
          ? "Verfügbar"
          : "Stokta";

  return (
    <div className="page-container py-6 sm:py-10">
      <Link
        href={product.category_slug ? `/products/${product.category_slug}` : "/products"}
        className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === "de" ? "Zurück" : "Geri"}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square bg-bosporus-gray-50 rounded-2xl overflow-hidden">
          <Image src={img} alt={name} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" priority />
          {isDeal && (
            <div className="absolute top-4 left-4">
              <Badge variant="promo">{t("promo")}</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-bosporus-muted font-mono mb-2">{product.sku}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-3 leading-tight">{name}</h1>
          <p className="text-sm text-bosporus-muted mb-4">{formatUnit(product.base_unit, locale)}</p>

          <span
            className={cn(
              "inline-block w-fit text-xs font-bold px-3 py-1 rounded-lg mb-6",
              avail === "in_stock" && "bg-green-50 text-green-700",
              avail === "limited" && "bg-amber-50 text-amber-700",
              avail === "out_of_stock" && "bg-red-50 text-red-700"
            )}
          >
            {stockLabel}
          </span>

          <div className="mb-8">
            {displayPrice.isPromo && displayPrice.originalAmount != null && (
              <span className="text-lg text-bosporus-muted line-through block mb-1">
                {formatPrice(displayPrice.originalAmount, locale)}
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className={cn("text-4xl font-extrabold", isDeal ? "text-bosporus-red" : "text-bosporus-gray-800")}>
                {formatPrice(displayPrice.amount, locale)}
              </span>
              <span className="text-sm text-bosporus-muted">
                {displayPrice.label === "brutto" ? t("brutto") : t("netto")}
              </span>
            </div>
          </div>

          <Button type="button" onClick={handleAdd} size="lg" disabled={outOfStock} className="w-full sm:w-auto">
            <ShoppingCart className="w-5 h-5" />
            {outOfStock ? stockLabel : t("addToCart")}
          </Button>

          {product.barcode && (
            <p className="text-xs text-bosporus-muted mt-6">
              {locale === "de" ? "Barcode" : "Barkod"}: {product.barcode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
