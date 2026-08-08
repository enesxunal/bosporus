"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Heart, Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthOptional } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/stores/cart";
import { useShopProfile } from "@/hooks/useShopProfile";
import type { Product } from "@/lib/types";
import { getDisplayPrice, formatPrice, formatUnit } from "@/lib/pricing";
import { getAvailability } from "@/lib/category-images";
import { getProductName } from "@/lib/product-display";
import { buildCartItemFromProduct } from "@/lib/pfand";
import { trackAddToCart } from "@/lib/analytics";
import { ProductImage } from "@/components/b2c/ProductImage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const authLoading = auth?.loading ?? true;
  const profile = useShopProfile();
  const { removeFavorite } = useFavorites();
  const addItem = useCart((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/favorites?details=1");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { products?: Product[] };
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    queueMicrotask(() => {
      void load();
    });
  }, [authLoading, user, router, load]);

  if (authLoading || loading) {
    return (
      <div className="page-container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-bosporus" />
            {t("title")}
          </h1>
          <p className="text-sm text-bosporus-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/account" className="text-sm font-semibold text-bosporus hover:underline">
          {t("backToAccount")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="page-narrow py-16 text-center">
          <p className="text-bosporus-muted mb-6">{t("empty")}</p>
          <Link href="/products">
            <Button size="lg">{t("browse")}</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-bosporus-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bosporus-gray-50 text-left text-bosporus-muted">
                  <th className="px-4 py-3 font-semibold">{t("colProduct")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colSku")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colPrice")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colStock")}</th>
                  <th className="px-4 py-3 font-semibold w-28">{t("colQty")}</th>
                  <th className="px-4 py-3 font-semibold w-40" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const name = getProductName(p, locale);
                  const price = getDisplayPrice(p, profile);
                  const out = getAvailability(p) === "out_of_stock";
                  const qty = qtys[p.id] ?? 1;
                  return (
                    <tr key={p.id} className="border-t border-bosporus-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-bosporus-gray-50 shrink-0">
                            <ProductImage product={p} className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-bosporus-gray-800 truncate">{name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-bosporus-muted">{p.sku}</td>
                      <td className="px-4 py-3 font-bold text-bosporus">
                        {price.hidden ? "—" : formatPrice(price.amount, locale)}
                        <span className="block text-xs font-medium text-bosporus-muted">
                          {formatUnit(p.base_unit, locale)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-1 rounded-lg",
                            out ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                          )}
                        >
                          {out ? t("outOfStock") : t("inStock")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          disabled={out}
                          value={qty}
                          onChange={(e) =>
                            setQtys((prev) => ({
                              ...prev,
                              [p.id]: Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                            }))
                          }
                          className="!py-1.5"
                          aria-label={t("colQty")}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            type="button"
                            size="sm"
                            disabled={out}
                            onClick={() => {
                              if (out) return;
                              addItem(buildCartItemFromProduct(p, qty, profile, name));
                              trackAddToCart({
                                item_id: p.sku,
                                item_name: name,
                                price: price.amount,
                                quantity: qty,
                              });
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {t("addToCart")}
                          </Button>
                          <button
                            type="button"
                            className="p-2 rounded-xl text-bosporus-muted hover:text-bosporus-red hover:bg-red-50"
                            aria-label={t("remove")}
                            onClick={async () => {
                              await removeFavorite(p.id, {
                                item_id: p.sku,
                                item_name: name,
                              });
                              setProducts((list) => list.filter((x) => x.id !== p.id));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden space-y-3">
            {products.map((p) => {
              const name = getProductName(p, locale);
              const price = getDisplayPrice(p, profile);
              const out = getAvailability(p) === "out_of_stock";
              const qty = qtys[p.id] ?? 1;
              return (
                <li
                  key={p.id}
                  className="bg-white rounded-2xl border border-bosporus-gray-200 p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bosporus-gray-50 shrink-0">
                      <ProductImage product={p} className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-bosporus-gray-800">{name}</p>
                      <p className="text-xs text-bosporus-muted font-mono mt-0.5">{p.sku}</p>
                      <p className="text-lg font-extrabold text-bosporus mt-1">
                        {price.hidden ? "—" : formatPrice(price.amount, locale)}
                      </p>
                      <p className="text-xs font-bold mt-1 text-bosporus-muted">
                        {out ? t("outOfStock") : t("inStock")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      disabled={out}
                      value={qty}
                      onChange={(e) =>
                        setQtys((prev) => ({
                          ...prev,
                          [p.id]: Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                        }))
                      }
                      className="!py-2 flex-1"
                      aria-label={t("colQty")}
                    />
                    <Button
                      type="button"
                      disabled={out}
                      onClick={() => {
                        if (out) return;
                        addItem(buildCartItemFromProduct(p, qty, profile, name));
                        trackAddToCart({
                          item_id: p.sku,
                          item_name: name,
                          price: price.amount,
                          quantity: qty,
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <button
                      type="button"
                      className="p-2 rounded-xl text-bosporus-muted hover:text-bosporus-red"
                      aria-label={t("remove")}
                      onClick={async () => {
                        await removeFavorite(p.id, { item_id: p.sku, item_name: name });
                        setProducts((list) => list.filter((x) => x.id !== p.id));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
