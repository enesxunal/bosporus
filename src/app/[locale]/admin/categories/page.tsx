"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { RefreshCw, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Category {
  id: string;
  slug: string;
  name_de: string;
  name_tr: string | null;
  sort_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [slug, setSlug] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [nameTr, setNameTr] = useState("");

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    const data = await res.json();
    setSyncing(false);
    setMsg(data.synced ? `${data.synced} kategori aktarıldı` : data.errors?.[0] ?? "Hata");
    load();
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name_de: nameDe, name_tr: nameTr || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Eklenemedi");
      return;
    }
    setMsg("Kategori eklendi");
    setSlug("");
    setNameDe("");
    setNameTr("");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-metro-navy">Kategoriler</h1>
          <p className="text-sm text-bosporus-muted">{categories.length} kategori</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={syncing}>
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            JSON&apos;dan Aktar
          </Button>
          <Link href="/admin/products">
            <Button variant="outline">Ürünlere dön</Button>
          </Link>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

      <Card className="!rounded-2xl mb-6">
        <h2 className="font-bold mb-4">Yeni kategori ekle</h2>
        <form onSubmit={addCategory} className="grid sm:grid-cols-3 gap-3">
          <Input label="Slug (URL)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ornek-kategori" required />
          <Input label="Ad (DE)" value={nameDe} onChange={(e) => setNameDe(e.target.value)} required />
          <Input label="Ad (TR)" value={nameTr} onChange={(e) => setNameTr(e.target.value)} />
          <div className="sm:col-span-3">
            <Button type="submit"><Plus className="w-4 h-4" /> Kategori ekle</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        {categories.map((c) => (
          <Card key={c.id} padding="sm" className="!rounded-xl">
            <div className="flex justify-between items-center gap-3">
              <div>
                <p className="font-semibold">{c.name_de}</p>
                <p className="text-xs text-bosporus-muted">{c.slug}{c.name_tr ? ` · ${c.name_tr}` : ""}</p>
              </div>
              <Link href={`/products/${c.slug}`} className="text-xs text-bosporus font-semibold hover:underline shrink-0">
                Mağazada gör →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
