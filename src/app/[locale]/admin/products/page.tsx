"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search, ChevronRight, Plus, Percent, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ProductRow {
  id: string;
  sku: string;
  name_de: string;
  name_tr: string | null;
  category_slug: string | null;
  price_b2c: number;
  price_b2b: number;
  promo_price: number | null;
  is_active: boolean;
  stock_status: string;
}

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const PAGE_SIZE = 50;

  const load = useCallback(async (fromOffset: number, append: boolean) => {
    if (fromOffset === 0) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(fromOffset),
    });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();

    setProducts((prev) => (append ? [...prev, ...(data.products ?? [])] : data.products ?? []));
    setTotal(data.total ?? 0);
    setOffset(fromOffset + (data.products?.length ?? 0));
    setLoading(false);
    setLoadingMore(false);
  }, [search]);

  useEffect(() => {
    setOffset(0);
    load(0, false);
  }, [load]);

  const syncCatalog = async () => {
    if (!confirm("CSV katalogunu veritabanına senkronize etmek istiyor musunuz? Görseller korunur.")) return;
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/products/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error ?? "Senkron hatası");
        return;
      }
      setSyncMsg(
        `Senkron tamam: ${data.synced ?? 0} ürün` +
          (data.deactivated ? `, ${data.deactivated} eski ürün pasife alındı` : "") +
          (data.errors?.length ? ` — uyarı: ${data.errors.join("; ")}` : "")
      );
      await load(0, false);
    } catch {
      setSyncMsg("Bağlantı hatası");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-metro-navy">Ürünler</h1>
          <p className="text-sm text-bosporus-muted">{total} ürün</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={syncCatalog} loading={syncing}>
            <RefreshCw className="w-4 h-4" /> Katalog senkron
          </Button>
          <Link href="/admin/products/new">
            <Button><Plus className="w-4 h-4" />{t("addProduct")}</Button>
          </Link>
          <Link href="/admin/products/bulk">
            <Button variant="secondary"><Percent className="w-4 h-4" />{t("bulkEdit")}</Button>
          </Link>
        </div>
      </div>

      {syncMsg && (
        <div className="mb-4 p-3 rounded-xl text-sm bg-bosporus-light text-bosporus-gray-800">{syncMsg}</div>
      )}

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => { e.preventDefault(); setSearch(q); }}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün adı, SKU veya barkod ara..."
            className="field-input !pl-10"
          />
        </div>
        <Button type="submit">Ara</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>
      ) : products.length === 0 ? (
        <Card className="text-center py-12 !rounded-2xl">
          <p className="text-bosporus-muted mb-4">Henüz ürün yok.</p>
          <Link href="/admin/products/new">
            <Button>{t("addProduct")}</Button>
          </Link>
        </Card>
      ) : (
        <>
          <p className="text-sm text-bosporus-muted mb-3">
            {products.length} / {total} ürün gösteriliyor
          </p>
          <div className="space-y-2">
            {products.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`}>
                <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{p.name_de}</p>
                      <p className="text-xs text-bosporus-muted">
                        {p.sku} · {p.category_slug ?? "—"}
                        {!p.is_active && <span className="ml-2 text-bosporus-red font-bold">Pasif</span>}
                        {p.stock_status === "out_of_stock" && (
                          <span className="ml-2 text-orange-600 font-bold">Tükendi</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-bosporus">{Number(p.price_b2c).toFixed(2)} €</p>
                      <p className="text-xs text-bosporus-muted">B2B: {Number(p.price_b2b).toFixed(2)} €</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-bosporus-muted shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {products.length < total && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => load(offset, true)} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : t("loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
