"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name_de: string;
  name_tr: string | null;
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
}

export default function AdminProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: keyof Product, value: string | number | boolean | null) => {
    if (!product) return;
    setProduct({ ...product, [field]: value });
  };

  const save = async () => {
    if (!product) return;
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Kaydedildi!");
      const d = await res.json();
      setProduct(d.product);
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Hata oluştu");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  if (!product) {
    return <p className="text-center text-bosporus-muted py-12">Ürün bulunamadı</p>;
  }

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-4">
        <ArrowLeft className="w-4 h-4" /> Ürünlere dön
      </Link>

      <h1 className="text-xl font-extrabold text-metro-navy mb-1">{product.name_de}</h1>
      <p className="text-sm text-bosporus-muted mb-6">SKU: {product.sku}</p>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

      <Card className="!rounded-2xl space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Ad (DE)" value={product.name_de} onChange={(e) => update("name_de", e.target.value)} />
          <Input label="Ad (TR)" value={product.name_tr ?? ""} onChange={(e) => update("name_tr", e.target.value || null)} />
          <Input label="Barkod" value={product.barcode ?? ""} onChange={(e) => update("barcode", e.target.value || null)} />
          <Input label="Kategori" value={product.category_slug ?? ""} onChange={(e) => update("category_slug", e.target.value || null)} />
          <Input label="B2C Fiyat (€)" type="number" step="0.01" value={product.price_b2c} onChange={(e) => update("price_b2c", Number(e.target.value))} />
          <Input label="B2B Fiyat (€)" type="number" step="0.01" value={product.price_b2b} onChange={(e) => update("price_b2b", Number(e.target.value))} />
          <Input label="Kampanya Fiyatı (€)" type="number" step="0.01" value={product.promo_price ?? ""} onChange={(e) => update("promo_price", e.target.value ? Number(e.target.value) : null)} />
          <Input label="KDV (%)" type="number" value={product.tax_rate} onChange={(e) => update("tax_rate", Number(e.target.value))} />
          <Input label="Kampanya Başlangıç" type="date" value={product.promo_from ?? ""} onChange={(e) => update("promo_from", e.target.value || null)} />
          <Input label="Kampanya Bitiş" type="date" value={product.promo_to ?? ""} onChange={(e) => update("promo_to", e.target.value || null)} />
          <Input label="Görsel URL" value={product.image_url ?? ""} onChange={(e) => update("image_url", e.target.value || null)} />
          <div>
            <label className="field-label">Stok Durumu</label>
            <select value={product.stock_status} onChange={(e) => update("stock_status", e.target.value)} className="field-input">
              <option value="in_stock">Stokta</option>
              <option value="low_stock">Az stok</option>
              <option value="out_of_stock">Tükendi</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_active"
              checked={product.is_active}
              onChange={(e) => update("is_active", e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="is_active" className="font-semibold text-sm">Ürün aktif (mağazada görünsün)</label>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </Card>
    </div>
  );
}
