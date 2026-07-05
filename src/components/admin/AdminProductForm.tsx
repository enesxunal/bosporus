"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Save, Upload, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/shared/BarcodeScanner";
import { cn } from "@/lib/cn";

interface Category {
  id: string;
  slug: string;
  name_de: string;
  name_tr: string | null;
}

interface ProductForm {
  id?: string;
  sku: string;
  barcode: string | null;
  name_de: string;
  name_tr: string | null;
  description_de: string | null;
  description_tr: string | null;
  category_slug: string | null;
  price_b2c: number;
  price_b2b: number;
  promo_price: number | null;
  promo_from: string | null;
  promo_to: string | null;
  tax_rate: number;
  is_active: boolean;
  stock_status: string;
  image_url: string | null;
  image_urls: string[];
}

const EMPTY: ProductForm = {
  sku: "",
  barcode: null,
  name_de: "",
  name_tr: null,
  description_de: null,
  description_tr: null,
  category_slug: null,
  price_b2c: 0,
  price_b2b: 0,
  promo_price: null,
  promo_from: null,
  promo_to: null,
  tax_rate: 19,
  is_active: true,
  stock_status: "in_stock",
  image_url: null,
  image_urls: [],
};

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [product, setProduct] = useState<ProductForm | null>(isNew ? EMPTY : null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((c) => setCategories(c.categories ?? []));

    if (!productId) return;

    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((p) => {
        const raw = p.product;
        if (raw) {
          const urls = Array.isArray(raw.image_urls)
            ? raw.image_urls.filter((u: unknown) => typeof u === "string")
            : raw.image_url
              ? [raw.image_url]
              : [];
          setProduct({ ...raw, image_urls: urls });
        }
        setLoading(false);
      });
  }, [productId]);

  const update = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    if (!product) return;
    setProduct({ ...product, [field]: value });
  };

  const setImages = (urls: string[]) => {
    if (!product) return;
    setProduct({ ...product, image_urls: urls, image_url: urls[0] ?? null });
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Yükleme başarısız");
      return;
    }
    setImages([...(product?.image_urls ?? []), data.url]);
    setMsg("Görsel yüklendi");
  };

  const save = async () => {
    if (!product) return;
    setSaving(true);
    setMsg("");

    const url = isNew ? "/api/admin/products" : `/api/admin/products/${productId}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    setSaving(false);

    if (res.ok) {
      const d = await res.json();
      setMsg(isNew ? "Ürün oluşturuldu!" : "Kaydedildi!");
      if (isNew && d.product?.id) {
        router.push(`/admin/products/${d.product.id}`);
        return;
      }
      const urls = Array.isArray(d.product.image_urls) ? d.product.image_urls : [];
      setProduct({ ...d.product, image_urls: urls.length ? urls : d.product.image_url ? [d.product.image_url] : [] });
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Hata");
    }
  };

  const remove = async () => {
    if (!productId || !confirm("Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/admin/products");
    else {
      const d = await res.json();
      setMsg(d.error ?? "Silinemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (!product) return <p className="text-center py-12 text-bosporus-muted">Ürün bulunamadı</p>;

  return (
    <div className="space-y-6">
      {msg && (
        <div className={cn("p-3 rounded-xl text-sm", msg.includes("Hata") || msg.includes("başarısız") || msg.includes("Silinemedi") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}>
          {msg}
        </div>
      )}

      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg mb-4">Temel Bilgiler</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {isNew ? (
            <Input label="SKU (boş bırakılırsa otomatik)" value={product.sku} onChange={(e) => update("sku", e.target.value)} placeholder="MAN-001" />
          ) : (
            <Input label="SKU (değiştirilemez)" value={product.sku} disabled />
          )}
          <div>
            <Input label="Barkod" value={product.barcode ?? ""} onChange={(e) => update("barcode", e.target.value || null)} />
            <div className="mt-2">
              <BarcodeScanner onScan={(code) => update("barcode", code)} label="Barkod tara" />
            </div>
          </div>
          <Input label="Ad (DE)" value={product.name_de} onChange={(e) => update("name_de", e.target.value)} />
          <Input label="Ad (TR)" value={product.name_tr ?? ""} onChange={(e) => update("name_tr", e.target.value || null)} />
          <div className="sm:col-span-2">
            <label className="field-label">Kategori</label>
            <div className="flex gap-2">
              <select
                value={product.category_slug ?? ""}
                onChange={(e) => update("category_slug", e.target.value || null)}
                className="field-input flex-1"
              >
                <option value="">— Kategori seçin —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name_de} ({c.slug})
                  </option>
                ))}
              </select>
              <Link href="/admin/categories">
                <Button type="button" variant="outline" size="md">
                  <Plus className="w-4 h-4" />
                  Yeni
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg mb-4">Açıklama</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Textarea label="Açıklama (DE)" value={product.description_de ?? ""} onChange={(e) => update("description_de", e.target.value || null)} rows={5} />
          <Textarea label="Açıklama (TR)" value={product.description_tr ?? ""} onChange={(e) => update("description_tr", e.target.value || null)} rows={5} />
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg mb-4">Fotoğraflar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {product.image_urls.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-bosporus-gray-200 group">
              <Image src={url} alt="" fill className="object-cover" sizes="120px" />
              {i === 0 && <span className="absolute top-1 left-1 bg-bosporus-yellow text-xs font-bold px-1.5 py-0.5 rounded">Ana</span>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => { const next = [...product.image_urls]; const [item] = next.splice(i, 1); next.unshift(item); setImages(next); }} className="p-1.5 bg-white rounded-lg">
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button type="button" onClick={() => setImages(product.image_urls.filter((_, j) => j !== i))} className="p-1.5 bg-white rounded-lg text-bosporus-red">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Bilgisayardan yükle
          </Button>
          <div className="flex flex-1 gap-2">
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://… görsel linki" className="field-input flex-1" />
            <Button type="button" variant="outline" onClick={() => { if (newUrl.trim()) { setImages([...product.image_urls, newUrl.trim()]); setNewUrl(""); } }}>
              <Plus className="w-4 h-4" /> URL ekle
            </Button>
          </div>
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg mb-4">Fiyat & Stok</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="B2C Fiyat (€)" type="number" step="0.01" value={product.price_b2c} onChange={(e) => update("price_b2c", Number(e.target.value))} />
          <Input label="B2B Fiyat (€)" type="number" step="0.01" value={product.price_b2b} onChange={(e) => update("price_b2b", Number(e.target.value))} />
          <Input label="Kampanya Fiyatı (€)" type="number" step="0.01" value={product.promo_price ?? ""} onChange={(e) => update("promo_price", e.target.value ? Number(e.target.value) : null)} />
          <Input label="KDV (%)" type="number" value={product.tax_rate} onChange={(e) => update("tax_rate", Number(e.target.value))} />
          <Input label="Kampanya Başlangıç" type="date" value={product.promo_from ?? ""} onChange={(e) => update("promo_from", e.target.value || null)} />
          <Input label="Kampanya Bitiş" type="date" value={product.promo_to ?? ""} onChange={(e) => update("promo_to", e.target.value || null)} />
          <div>
            <label className="field-label">Stok Durumu</label>
            <select value={product.stock_status} onChange={(e) => update("stock_status", e.target.value)} className="field-input">
              <option value="in_stock">Stokta</option>
              <option value="low_stock">Az stok</option>
              <option value="out_of_stock">Tükendi</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="is_active" checked={product.is_active} onChange={(e) => update("is_active", e.target.checked)} className="w-5 h-5 rounded" />
            <label htmlFor="is_active" className="font-semibold text-sm">Mağazada aktif</label>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving} size="lg">
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor…" : isNew ? "Ürünü oluştur" : "Tüm değişiklikleri kaydet"}
        </Button>
        {!isNew && (
          <Button variant="outline" onClick={remove} disabled={deleting} className="!text-bosporus-red !border-red-200">
            <Trash2 className="w-4 h-4" />
            {deleting ? "Siliniyor…" : "Ürünü sil"}
          </Button>
        )}
      </div>
    </div>
  );
}
