"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
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
import { B2C_MARKUP, getB2cGross, netToGross } from "@/lib/pricing";
import type { Product } from "@/lib/types";

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
  const t = useTranslations("adminProductForm");
  const ta = useTranslations("admin");
  const router = useRouter();
  const isNew = !productId;
  const [product, setProduct] = useState<ProductForm | null>(isNew ? EMPTY : null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(true);

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
      setMsgOk(false);
      setMsg(data.error ?? t("uploadFailed"));
      return;
    }
    setImages([...(product?.image_urls ?? []), data.url]);
  };

  const save = async () => {
    if (!product) return;
    if (!product.name_de.trim()) {
      setMsgOk(false);
      setMsg(t("nameRequired"));
      return;
    }
    setSaving(true);
    setMsg("");

    const url = isNew ? "/api/admin/products" : `/api/admin/products/${productId}`;
    const method = isNew ? "POST" : "PATCH";

    // Liste fiyatı toptan (net); bireysel brüt = net × %20 × KDV — kayda yazılır (referans)
    const payload = {
      ...product,
      price_b2c: getB2cGross(product as Product, false),
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      const d = await res.json();
      setMsgOk(true);
      setMsg(isNew ? t("created") : t("saved"));
      if (isNew && d.product?.id) {
        router.push(`/admin/products/${d.product.id}`);
        return;
      }
      const urls = Array.isArray(d.product.image_urls) ? d.product.image_urls : [];
      setProduct({ ...d.product, image_urls: urls.length ? urls : d.product.image_url ? [d.product.image_url] : [] });
    } else {
      const d = await res.json();
      setMsgOk(false);
      setMsg(d.error ?? ta("error"));
    }
  };

  const remove = async () => {
    if (!productId || !confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/admin/products");
    else {
      const d = await res.json();
      setMsgOk(false);
      setMsg(d.error ?? t("deleteFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  if (!product) return <p className="text-center py-12 text-bosporus-muted">{t("notFound")}</p>;

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
          <p className="font-bold text-lg text-metro-navy truncate">{product.name_de || t("newProduct")}</p>
          <p className="text-sm text-bosporus-muted">
            {product.sku || t("autoSku")} · {product.category_slug ?? t("noCategory")}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", product.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {product.is_active ? ta("active") : ta("inactive")}
            </span>
            {product.stock_status === "out_of_stock" && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{ta("outOfStock")}</span>
            )}
            <span className="text-xs font-bold text-bosporus">{Number(product.price_b2c).toFixed(2)} € B2C</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className={cn("mb-4 p-3 rounded-xl text-sm", msgOk ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sol: ana içerik — mantıksal sıra */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Görseller */}
          <Card className="!rounded-2xl">
            <SectionTitle step={1} title={t("images")} icon={ImageIcon} />
            <ProductImageGallery
              urls={product.image_urls}
              onChange={setImages}
              onUpload={uploadFile}
              uploading={uploading}
            />
          </Card>

          {/* 2. Ürün adı & kategori */}
          <Card className="!rounded-2xl">
            <SectionTitle step={2} title={t("productInfo")} />
            <div className="space-y-4">
              <Input
                label={t("nameDe")}
                value={product.name_de}
                onChange={(e) => update("name_de", e.target.value)}
                placeholder="z.B. Olivenöl 1L"
              />
              <Input
                label={t("nameTr")}
                value={product.name_tr ?? ""}
                onChange={(e) => update("name_tr", e.target.value || null)}
                placeholder={t("optional")}
              />
              <div>
                <label className="field-label">{t("category")}</label>
                <div className="flex gap-2">
                  <select
                    value={product.category_slug ?? ""}
                    onChange={(e) => update("category_slug", e.target.value || null)}
                    className="field-input flex-1"
                  >
                    <option value="">{t("selectCategory")}</option>
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
            <SectionTitle step={3} title={t("description")} />
            <div className="space-y-4">
              <Textarea
                label={t("descDe")}
                value={product.description_de ?? ""}
                onChange={(e) => update("description_de", e.target.value || null)}
                rows={4}
                placeholder={t("descPlaceholder")}
              />
              <Textarea
                label={t("descTr")}
                value={product.description_tr ?? ""}
                onChange={(e) => update("description_tr", e.target.value || null)}
                rows={4}
                placeholder={t("optional")}
              />
            </div>
          </Card>
        </div>

        {/* Sağ: fiyat, durum, teknik */}
        <div className="space-y-6">
          {/* 4. Fiyatlar */}
          <Card className="!rounded-2xl">
            <SectionTitle step={4} title={t("prices")} icon={Euro} />
            <div className="space-y-4">
              <Input
                label={t("priceB2b")}
                type="number"
                step="0.01"
                min="0"
                value={product.price_b2b}
                onChange={(e) => update("price_b2b", Number(e.target.value))}
              />
              <Input
                label={t("taxRate")}
                type="number"
                value={product.tax_rate}
                onChange={(e) => update("tax_rate", Number(e.target.value))}
              />
              <div className="rounded-xl bg-bosporus-gray-50 border border-bosporus-gray-100 px-3 py-3">
                <p className="text-xs font-semibold text-bosporus-muted mb-1">{t("priceB2c")}</p>
                <p className="text-lg font-extrabold text-bosporus">
                  {getB2cGross(product as Product, false).toFixed(2)} €
                </p>
                <p className="text-xs text-bosporus-muted mt-1">
                  {product.price_b2b.toFixed(2)} × {Math.round((B2C_MARKUP - 1) * 100)}% +{" "}
                  {product.tax_rate}% MwSt. ={" "}
                  {netToGross(product.price_b2b * B2C_MARKUP, product.tax_rate).toFixed(2)} €
                </p>
              </div>

              <div className="pt-3 border-t border-bosporus-gray-100">
                <p className="text-sm font-bold text-metro-navy mb-3">{t("promoOptional")}</p>
                <div className="space-y-3">
                  <Input
                    label={t("promoPrice")}
                    type="number"
                    step="0.01"
                    value={product.promo_price ?? ""}
                    onChange={(e) => update("promo_price", e.target.value ? Number(e.target.value) : null)}
                    placeholder={t("promoEmpty")}
                  />
                  {hasPromo && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input label={t("promoFrom")} type="date" value={product.promo_from ?? ""} onChange={(e) => update("promo_from", e.target.value || null)} />
                      <Input label={t("promoTo")} type="date" value={product.promo_to ?? ""} onChange={(e) => update("promo_to", e.target.value || null)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl">
            <SectionTitle step={5} title={t("storeStatus")} />
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-bosporus-gray-200 cursor-pointer has-[:checked]:border-bosporus has-[:checked]:bg-bosporus-light/20">
                <input
                  type="checkbox"
                  checked={product.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                  className="w-5 h-5 rounded accent-bosporus"
                />
                <div>
                  <p className="font-semibold text-sm">{t("showInShop")}</p>
                  <p className="text-xs text-bosporus-muted">{t("hiddenHint")}</p>
                </div>
              </label>
              <div>
                <label className="field-label">{t("stockStatus")}</label>
                <select
                  value={product.stock_status}
                  onChange={(e) => update("stock_status", e.target.value)}
                  className="field-input"
                >
                  <option value="in_stock">{t("inStock")}</option>
                  <option value="low_stock">{t("lowStock")}</option>
                  <option value="out_of_stock">{ta("outOfStock")}</option>
                </select>
                <p className="text-xs text-bosporus-muted mt-1">{t("noStockTracking")}</p>
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl">
            <SectionTitle step={6} title={t("technical")} icon={Settings2} />
            <div className="space-y-4">
              {isNew ? (
                <Input label={t("sku")} value={product.sku} onChange={(e) => update("sku", e.target.value)} placeholder={t("skuAuto")} />
              ) : (
                <Input label={t("sku")} value={product.sku} disabled />
              )}
              <Input label={t("barcode")} value={product.barcode ?? ""} onChange={(e) => update("barcode", e.target.value || null)} />
              <BarcodeScanner onScan={(code) => update("barcode", code)} label={t("scanBarcode")} />
            </div>
          </Card>
        </div>
      </div>

      {/* Sabit kaydet çubuğu */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-bosporus-gray-200 px-4 py-3 lg:pl-72">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-bosporus-muted hidden sm:block">
            {isNew ? t("newProduct") : product.sku} · {t("saveReminder")}
          </p>
          <div className="flex gap-2 ml-auto w-full sm:w-auto">
            {!isNew && (
              <Button variant="outline" onClick={remove} disabled={deleting} className="!text-bosporus-red !border-red-200">
                <Trash2 className="w-4 h-4" />
                {deleting ? "…" : ta("delete")}
              </Button>
            )}
            <Button onClick={save} disabled={saving} size="lg" className="flex-1 sm:flex-none">
              <Save className="w-4 h-4" />
              {saving ? t("saving") : isNew ? t("createProduct") : ta("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
