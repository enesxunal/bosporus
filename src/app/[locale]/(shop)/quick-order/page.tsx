"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, Plus, Loader2, ShoppingCart } from "lucide-react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { isB2BApproved, type Product } from "@/lib/types";
import { formatPrice, getDisplayPrice, formatUnit } from "@/lib/pricing";
import { getProductName } from "@/lib/product-display";
import { getAvailability } from "@/lib/category-images";
import { buildCartItemFromProduct } from "@/lib/pfand";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

const MAX_QTY = 999;

export default function QuickOrderPage() {
  const t = useTranslations("quickOrder");
  const locale = useLocale() as "de" | "tr";
  const auth = useAuthOptional();
  const profile = auth?.b2bProfile ?? auth?.profile ?? null;
  const loadingAuth = auth?.loading ?? true;
  const addItem = useCart((s) => s.addItem);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const approved = isB2BApproved(profile);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/catalog/products?${params}`);
      const data = await res.json();
      setProducts((data.products ?? []) as Product[]);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!approved) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, approved, search]);

  if (loadingAuth) {
    return (
      <div className="page-container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="page-narrow py-16 text-center">
        <h1 className="text-xl font-bold text-bosporus-gray-800 mb-3">{t("title")}</h1>
        <p className="text-bosporus-muted mb-6">{t("gate")}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/register">
            <Button>{t("register")}</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">{t("login")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const setQty = (id: string, value: number) => {
    const n = Math.max(0, Math.min(MAX_QTY, Math.floor(value) || 0));
    setQtys((prev) => ({ ...prev, [id]: n }));
  };

  const addSelected = () => {
    setAdding(true);
    setMsg("");
    let count = 0;
    for (const p of products) {
      const q = qtys[p.id] ?? 0;
      if (q <= 0) continue;
      if (getAvailability(p) === "out_of_stock") continue;
      addItem(buildCartItemFromProduct(p, q, profile, getProductName(p, locale)));
      count += 1;
    }
    setAdding(false);
    if (count === 0) {
      setMsg(t("noneSelected"));
      return;
    }
    setMsg(t("added", { count }));
    setQtys({});
  };

  const onQtyKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = products[index + 1];
    if (next) {
      qtyRefs.current[next.id]?.focus();
      qtyRefs.current[next.id]?.select();
    }
  };

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-bosporus-muted mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={addSelected} disabled={adding} size="lg">
          <ShoppingCart className="w-4 h-4" />
          {t("addSelected")}
        </Button>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-bosporus-light border border-bosporus/20 text-sm flex flex-wrap justify-between gap-2">
          <span>{msg}</span>
          <Link href="/cart" className="font-bold text-bosporus hover:underline">
            {t("goToCart")}
          </Link>
        </div>
      )}

      <div className="relative mb-5 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="field-input !pl-10"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-bosporus" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-bosporus-muted py-12">{t("noResults")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-bosporus-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bosporus-gray-50 text-left text-bosporus-muted">
                  <th className="px-4 py-3 font-semibold">{t("colProduct")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colSku")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colUnit")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colPrice")}</th>
                  <th className="px-4 py-3 font-semibold w-28">{t("colQty")}</th>
                  <th className="px-4 py-3 font-semibold w-20" />
                </tr>
              </thead>
              <tbody>
                {products.map((p, index) => {
                  const price = getDisplayPrice(p, profile);
                  const out = getAvailability(p) === "out_of_stock";
                  return (
                    <tr key={p.id} className="border-t border-bosporus-gray-100">
                      <td className="px-4 py-3 font-medium text-bosporus-gray-800">
                        {getProductName(p, locale)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-bosporus-muted">{p.sku}</td>
                      <td className="px-4 py-3">{formatUnit(p.base_unit, locale)}</td>
                      <td className="px-4 py-3 font-bold text-bosporus">
                        {formatPrice(price.amount, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          ref={(el) => {
                            qtyRefs.current[p.id] = el;
                          }}
                          type="number"
                          min={0}
                          max={MAX_QTY}
                          disabled={out}
                          value={qtys[p.id] ?? ""}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                          onKeyDown={(e) => onQtyKeyDown(e, index)}
                          className="!py-1.5"
                          aria-label={t("colQty")}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={out || !(qtys[p.id] > 0)}
                          onClick={() => {
                            const q = qtys[p.id] ?? 0;
                            if (q <= 0 || out) return;
                            addItem(
                              buildCartItemFromProduct(p, q, profile, getProductName(p, locale))
                            );
                            setQtys((prev) => ({ ...prev, [p.id]: 0 }));
                            setMsg(t("added", { count: 1 }));
                          }}
                          className={cn(
                            "p-2 rounded-xl transition-colors",
                            out
                              ? "text-bosporus-muted opacity-40"
                              : "text-bosporus hover:bg-bosporus-light"
                          )}
                          aria-label={t("addOne")}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-3">
            {products.map((p) => {
              const price = getDisplayPrice(p, profile);
              const out = getAvailability(p) === "out_of_stock";
              return (
                <li
                  key={p.id}
                  className="bg-white rounded-2xl border border-bosporus-gray-200 p-4 space-y-3"
                >
                  <div>
                    <p className="font-semibold text-bosporus-gray-800">{getProductName(p, locale)}</p>
                    <p className="text-xs text-bosporus-muted font-mono mt-0.5">{p.sku}</p>
                    <p className="text-lg font-extrabold text-bosporus mt-2">
                      {formatPrice(price.amount, locale)}
                      <span className="text-xs font-medium text-bosporus-muted ml-1">
                        {formatUnit(p.base_unit, locale)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={MAX_QTY}
                      disabled={out}
                      value={qtys[p.id] ?? ""}
                      onChange={(e) => setQty(p.id, Number(e.target.value))}
                      className="!py-2 flex-1"
                      aria-label={t("colQty")}
                    />
                    <Button
                      type="button"
                      disabled={out || !(qtys[p.id] > 0)}
                      onClick={() => {
                        const q = qtys[p.id] ?? 0;
                        if (q <= 0 || out) return;
                        addItem(
                          buildCartItemFromProduct(p, q, profile, getProductName(p, locale))
                        );
                        setQtys((prev) => ({ ...prev, [p.id]: 0 }));
                        setMsg(t("added", { count: 1 }));
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
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
