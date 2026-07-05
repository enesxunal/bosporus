"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Save, Trash2, Loader2, Plus, ImageIcon, Euro, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/shared/BarcodeScanner";
import { ProductImageGallery } from "@/components/admin/ProductImageGallery";
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

function SectionTitle({ step, title, icon: Icon }: { step: number; title: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-bosporus text-white text-xs font-bold shrink-0">
        {step}
      </span>
      <h2 className="font-bold text-lg text-metro-navy flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-bosporus" />}
        {title}
      </h2>
    </div>
  );
}

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [product, setProduct] = useState<ProductForm | null>(isNew ? EMPTY : null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

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
  };

  const save = async () => {
    if (!product) return;
    if (!product.name_de.trim()) {
      setMsg("Almanca ürün adı zorunlu");
      return;
    }
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

  const hasPromo = product.promo_price != null && product.promo_price > 0;

  return (
    <div className="pb-24">
      {/* Üst özet */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-2xl border border-bosporus-gray-200 shadow-sm">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bosporus-gray-100 shrink-0 border border-bosporus-gray-200">
          {product.image_urls[0] ? (
            <Image src={product.image_urls[0]} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-bosporus-muted text-xs">—</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg text-metro-navy truncate">{product.name_de || "Yeni ürün"}</p>
          <p className="text-sm text-bosporus-muted">
            {product.sku || "SKU otomatik"} · {product.category_slug ?? "Kategori yok"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", product.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {product.is_active ? "Aktif" : "Pasif"}
            </span>
            {product.stock_status === "out_of_stock" && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Tükendi</span>
            )}
            <span className="text-xs font-bold text-bosporus">{Number(product.price_b2c).toFixed(2)} € B2C</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className={cn("mb-4 p-3 rounded-xl text-sm", msg.includes("Hata") || msg.includes("başarısız") || msg.includes("Silinemedi") || msg.includes("zorunlu") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sol: ana içerik — mantıksal sıra */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Görseller */}
          <Card className="!rounded-2xl">
            <SectionTitle step={1} title="Görseller" icon={ImageIcon} />
            <ProductImageGallery
              urls={product.image_urls}
              onChange={setImages}
              onUpload={uploadFile}
              uploading={uploading}
            />
          </Card>

          {/* 2. Ürün adı & kategori */}
          <Card className="!rounded-2xl">
            <SectionTitle step={2} title="Ürün bilgisi" />
            <div className="space-y-4">
              <Input
                label="Ürün adı (Almanca) *"
                value={product.name_de}
                onChange={(e) => update("name_de", e.target.value)}
                placeholder="z.B. Olivenöl 1L"
              />
              <Input
                label="Ürün adı (Türkçe)"
                value={product.name_tr ?? ""}
                onChange={(e) => update("name_tr", e.target.value || null)}
                placeholder="Opsiyonel"
              />
              <div>
                <label className="field-label">Kategori</label>
                <div className="flex gap-2">
                  <select
                    value={product.category_slug ?? ""}
                    onChange={(e) => update("category_slug", e.target.value || null)}
                    className="field-input flex-1"
                  >
                    <option value="">— Seçin —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name_de}</option>
                    ))}
                  </select>
                  <Link href="/admin/categories">
                    <Button type="button" variant="outline" size="md"><Plus className="w-4 h-4" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Açıklama */}
          <Card className="!rounded-2xl">
            <SectionTitle step={3} title="Açıklama" />
            <div className="space-y-4">
              <Textarea
                label="Almanca"
                value={product.description_de ?? ""}
                onChange={(e) => update("description_de", e.target.value || null)}
                rows={4}
                placeholder="Ürün detayları…"
              />
              <Textarea
                label="Türkçe"
                value={product.description_tr ?? ""}
                onChange={(e) => update("description_tr", e.target.value || null)}
                rows={4}
                placeholder="Opsiyonel"
              />
            </div>
          </Card>
        </div>

        {/* Sağ: fiyat, durum, teknik */}
        <div className="space-y-6">
          {/* 4. Fiyatlar */}
          <Card className="!rounded-2xl">
            <SectionTitle step={4} title="Fiyatlar" icon={Euro} />
            <div className="space-y-4">
              <Input
                label="B2C fiyat (€, KDV dahil)"
                type="number"
                step="0.01"
                min="0"
                value={product.price_b2c}
                onChange={(e) => update("price_b2c", Number(e.target.value))}
              />
              <Input
                label="B2B fiyat (€, net)"
                type="number"
                step="0.01"
                min="0"
                value={product.price_b2b}
                onChange={(e) => update("price_b2b", Number(e.target.value))}
              />
              <Input
                label="KDV (%)"
                type="number"
                value={product.tax_rate}
                onChange={(e) => update("tax_rate", Number(e.target.value))}
              />

              <div className="pt-3 border-t border-bosporus-gray-100">
                <p className="text-sm font-bold text-metro-navy mb-3">Kampanya (opsiyonel)</p>
                <div className="space-y-3">
                  <Input
                    label="İndirimli fiyat (€, net)"
                    type="number"
                    step="0.01"
                    value={product.promo_price ?? ""}
                    onChange={(e) => update("promo_price", e.target.value ? Number(e.target.value) : null)}
                    placeholder="Boş = kampanya yok"
                  />
                  {hasPromo && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Başlangıç" type="date" value={product.promo_from ?? ""} onChange={(e) => update("promo_from", e.target.value || null)} />
                      <Input label="Bitiş" type="date" value={product.promo_to ?? ""} onChange={(e) => update("promo_to", e.target.value || null)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 5. Durum */}
          <Card className="!rounded-2xl">
            <SectionTitle step={5} title="Mağaza durumu" />
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-bosporus-gray-200 cursor-pointer has-[:checked]:border-bosporus has-[:checked]:bg-bosporus-light/20">
                <input
                  type="checkbox"
                  checked={product.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                  className="w-5 h-5 rounded accent-bosporus"
                />
                <div>
                  <p className="font-semibold text-sm">Mağazada göster</p>
                  <p className="text-xs text-bosporus-muted">Kapalıysa sitede görünmez</p>
                </div>
              </label>
              <div>
                <label className="field-label">Satış durumu</label>
                <select
                  value={product.stock_status}
                  onChange={(e) => update("stock_status", e.target.value)}
                  className="field-input"
                >
                  <option value="in_stock">Satışa açık</option>
                  <option value="low_stock">Az stok (uyarı)</option>
                  <option value="out_of_stock">Tükendi (sepete eklenemez)</option>
                </select>
                <p className="text-xs text-bosporus-muted mt-1">Adet takibi yok — sadece açık/kapalı</p>
              </div>
            </div>
          </Card>

          {/* 6. Teknik */}
          <Card className="!rounded-2xl">
            <SectionTitle step={6} title="Teknik bilgiler" icon={Settings2} />
            <div className="space-y-4">
              {isNew ? (
                <Input label="SKU" value={product.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Boş = otomatik" />
              ) : (
                <Input label="SKU" value={product.sku} disabled />
              )}
              <Input label="Barkod" value={product.barcode ?? ""} onChange={(e) => update("barcode", e.target.value || null)} />
              <BarcodeScanner onScan={(code) => update("barcode", code)} label="Barkod tara" />
            </div>
          </Card>
        </div>
      </div>

      {/* Sabit kaydet çubuğu */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-bosporus-gray-200 px-4 py-3 lg:pl-72">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-bosporus-muted hidden sm:block">
            {isNew ? "Yeni ürün" : product.sku} · Değişiklikleri kaydetmeyi unutmayın
          </p>
          <div className="flex gap-2 ml-auto w-full sm:w-auto">
            {!isNew && (
              <Button variant="outline" onClick={remove} disabled={deleting} className="!text-bosporus-red !border-red-200">
                <Trash2 className="w-4 h-4" />
                {deleting ? "…" : "Sil"}
              </Button>
            )}
            <Button onClick={save} disabled={saving} size="lg" className="flex-1 sm:flex-none">
              <Save className="w-4 h-4" />
              {saving ? "Kaydediliyor…" : isNew ? "Ürünü oluştur" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
