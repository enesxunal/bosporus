"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { getDisplayPrice, formatPrice, formatUnit, netToGross, isPromoActive } from "@/lib/pricing";
import { getAvailability } from "@/lib/category-images";
import { getProductImages } from "@/lib/product-images";
import { getProductName, getProductDescription } from "@/lib/product-display";
import { trackRecentProduct } from "@/lib/recent-products";
import { useCart } from "@/stores/cart";
import { useShopProfile } from "@/hooks/useShopProfile";
import { RecommendedProducts } from "@/components/b2c/RecommendedProducts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { buildCartItemFromProduct } from "@/lib/pfand";
import { isB2BApproved } from "@/lib/types";
import { PriceGateCta } from "@/components/b2c/PriceGateCta";
import { trackAddToCart, trackViewItem } from "@/lib/analytics";

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const t = useTranslations("product");
  const locale = useLocale() as "de" | "tr";
  const profile = useShopProfile();
  const addItem = useCart((s) => s.addItem);
  const images = getProductImages(product);
  const [activeImage, setActiveImage] = useState(0);
  const displayPrice = getDisplayPrice(product, profile);
  const pricesHidden = displayPrice.hidden;
  const isDeal = !pricesHidden && isPromoActive(product);
  const avail = getAvailability(product);
  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);
  const outOfStock = avail === "out_of_stock";

  useEffect(() => {
    trackRecentProduct(product.sku);
    trackViewItem({
      item_id: product.sku,
      item_name: name,
      price: displayPrice.amount,
    });
  }, [product.sku, name, displayPrice.amount]);

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(buildCartItemFromProduct(product, 1, profile, name));
    trackAddToCart({
      item_id: product.sku,
      item_name: name,
      price: getDisplayPrice(product, profile).amount,
      quantity: 1,
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
        <div>
          <div className="relative aspect-square bg-bosporus-gray-50 rounded-2xl overflow-hidden mb-3">
            <Image
              src={images[activeImage] ?? images[0]}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
              priority
            />
            {isDeal && (
              <div className="absolute top-4 left-4">
                <Badge variant="promo">{t("promo")}</Badge>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors",
                    i === activeImage ? "border-bosporus" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
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

          <div className="mb-6">
            {pricesHidden ? (
              <PriceGateCta />
            ) : (
              <>
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
                {product.pfand && (
                  <p className="text-sm text-bosporus-muted mt-2">
                    {t("plusPfand", {
                      amount: formatPrice(
                        isB2BApproved(profile)
                          ? netToGross(product.pfand.price_b2b, product.pfand.tax_rate)
                          : product.pfand.price_b2c,
                        locale
                      ),
                    })}
                  </p>
                )}
                {!isB2BApproved(profile) && (
                  <p className="text-xs text-bosporus-muted mt-3 max-w-md leading-relaxed">
                    {t("wholesaleHintDetail")}{" "}
                    <Link href="/register" className="font-semibold text-bosporus hover:underline">
                      {locale === "de" ? "Jetzt anfragen →" : "Başvur →"}
                    </Link>
                  </p>
                )}
              </>
            )}
          </div>

          <Button type="button" onClick={handleAdd} size="lg" disabled={outOfStock} className="w-full sm:w-auto mb-8">
            <ShoppingCart className="w-5 h-5" />
            {outOfStock ? stockLabel : t("addToCart")}
          </Button>

          {description && (
            <div className="border-t border-bosporus-gray-100 pt-6">
              <h2 className="font-bold text-bosporus-gray-800 mb-2">
                {locale === "de" ? "Beschreibung" : "Açıklama"}
              </h2>
              <p className="text-sm text-bosporus-muted leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {product.barcode && (
            <p className="text-xs text-bosporus-muted mt-6">
              {locale === "de" ? "Barcode" : "Barkod"}: {product.barcode}
            </p>
          )}
        </div>
      </div>

      <RecommendedProducts excludeSku={product.sku} categorySlug={product.category_slug} />
    </div>
  );
}
