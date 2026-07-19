"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import type { Product, UserProfile } from "@/lib/types";
import { getDisplayPrice, formatPrice, formatUnit } from "@/lib/pricing";
import { useCart } from "@/stores/cart";
import { getProductImageUrl, getAvailability } from "@/lib/category-images";
import { getProductName } from "@/lib/product-display";
import { buildCartItemFromProduct } from "@/lib/pfand";
import { trackAddToCart, trackViewItem } from "@/lib/analytics";

interface ProductTableProps {
  products: Product[];
  profile?: UserProfile | null;
}

function AvailabilityBadge({ status, locale }: { status: ReturnType<typeof getAvailability>; locale: "de" | "tr" }) {
  const labels = {
    in_stock: { de: "Verfügbar", tr: "Stokta", class: "text-green-700 bg-green-50" },
    limited: { de: "Begrenzt", tr: "Sınırlı", class: "text-amber-700 bg-amber-50" },
    out_of_stock: { de: "Nicht verfügbar", tr: "Yok", class: "text-red-700 bg-red-50" },
  };
  const l = labels[status];
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${l.class}`}>
      {locale === "de" ? l.de : l.tr}
    </span>
  );
}

export function ProductTable({ products, profile = null }: ProductTableProps) {
  const t = useTranslations("b2b");
  const locale = useLocale() as "de" | "tr";
  const addItem = useCart((s) => s.addItem);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] ?? 1;

  const handleAdd = (product: Product) => {
    if (getAvailability(product) === "out_of_stock") return;
    const qty = getQty(product.id);
    const name = getProductName(product, locale);
    const dp = getDisplayPrice(product, profile);
    trackViewItem({
      item_id: product.sku,
      item_name: name,
      price: dp.amount,
    });
    addItem(buildCartItemFromProduct(product, qty, profile, name));
    trackAddToCart({
      item_id: product.sku,
      item_name: name,
      price: dp.amount,
      quantity: qty,
    });
    setQuantities((q) => ({ ...q, [product.id]: 1 }));
  };

  return (
    <div className="b2b-table-wrap overflow-x-auto border border-bosporus-gray-200 bg-white rounded-sm">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="bg-metro-navy text-white text-left">
            <th className="px-2 py-2 font-semibold w-12"></th>
            <th className="px-3 py-2 font-semibold">{t("colProduct")}</th>
            <th className="px-2 py-2 font-semibold w-24 hidden lg:table-cell">{t("colSku")}</th>
            <th className="px-2 py-2 font-semibold w-16">{t("colUnit")}</th>
            <th className="px-2 py-2 font-semibold w-24 hidden md:table-cell">
              {locale === "de" ? "Verfügbar" : "Stok"}
            </th>
            <th className="px-3 py-2 font-semibold w-28 text-right">{t("colPrice")}</th>
            <th className="px-2 py-2 font-semibold w-28 text-center">{t("colQty")}</th>
            <th className="px-2 py-2 font-semibold w-24"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const dp = getDisplayPrice(product, profile);
            const avail = getAvailability(product);
            const img = getProductImageUrl(product);
            return (
              <tr
                key={product.id}
                className="border-t border-bosporus-gray-200 hover:bg-bosporus-gray-50 even:bg-white odd:bg-bosporus-gray-50/50"
              >
                <td className="px-2 py-1.5">
                  <div className="relative w-10 h-10 bg-bosporus-gray-100 rounded-sm overflow-hidden shrink-0">
                    <Image src={img} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <p className="font-medium text-bosporus-gray-800 leading-tight line-clamp-2">{getProductName(product, locale)}</p>
                  <p className="text-bosporus-muted text-xs mt-0.5 lg:hidden font-mono">{product.sku.slice(0, 10)}</p>
                </td>
                <td className="px-2 py-1.5 text-bosporus-muted font-mono text-xs hidden lg:table-cell">
                  {product.sku.slice(0, 14)}
                </td>
                <td className="px-2 py-1.5 text-bosporus-muted whitespace-nowrap">
                  {formatUnit(product.base_unit, locale)}
                </td>
                <td className="px-2 py-1.5 hidden md:table-cell">
                  <AvailabilityBadge status={avail} locale={locale} />
                </td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                  {avail === "out_of_stock" ? (
                    <span className="text-bosporus-muted text-xs">
                      {locale === "de" ? "Preis auf Anfrage" : "Fiyat sorunuz"}
                    </span>
                  ) : (
                    <>
                      <span className={`font-bold ${dp.isPromo ? "text-bosporus-red" : "text-bosporus-gray-800"}`}>
                        {formatPrice(dp.amount, locale)}
                      </span>
                      {dp.isPromo && dp.originalAmount && (
                        <span className="block text-xs text-bosporus-muted line-through">
                          {formatPrice(dp.originalAmount, locale)}
                        </span>
                      )}
                      <span className="block text-xs text-bosporus-muted">{t("colPrice")} netto</span>
                    </>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(1, getQty(product.id) - 1),
                        }))
                      }
                      className="p-1 border border-bosporus-gray-200 rounded-sm hover:bg-bosporus-light"
                      disabled={avail === "out_of_stock"}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={getQty(product.id)}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-10 text-center border border-bosporus-gray-200 rounded-sm py-0.5 text-xs"
                      disabled={avail === "out_of_stock"}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: getQty(product.id) + 1,
                        }))
                      }
                      className="p-1 border border-bosporus-gray-200 rounded-sm hover:bg-bosporus-light"
                      disabled={avail === "out_of_stock"}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    disabled={avail === "out_of_stock"}
                    className="w-full py-1.5 px-2 bg-metro-navy text-white text-xs font-bold rounded-sm hover:bg-metro-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("quickAdd")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
