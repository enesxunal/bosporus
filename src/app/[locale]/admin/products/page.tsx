"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2, Search, RefreshCw, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const syncFromJson = async () => {
    setSyncing(true);
    setMsg("");
    const res = await fetch("/api/admin/products/sync", { method: "POST" });
    const data = await res.json();
    setSyncing(false);
    if (data.synced) {
      setMsg(`${data.synced} ürün veritabanına aktarıldı.`);
      load();
    } else {
      setMsg(data.errors?.[0] ?? "Aktarım başarısız");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-metro-navy">Ürünler</h1>
          <p className="text-sm text-bosporus-muted">{total} ürün</p>
        </div>
        <Button onClick={syncFromJson} disabled={syncing} variant="outline">
          <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          JSON&apos;dan Aktar
        </Button>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

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
          <p className="text-bosporus-muted mb-4">Henüz ürün yok. Önce &quot;JSON&apos;dan Aktar&quot; butonuna tıklayın.</p>
          <Button onClick={syncFromJson} disabled={syncing}>Ürünleri Aktar</Button>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
