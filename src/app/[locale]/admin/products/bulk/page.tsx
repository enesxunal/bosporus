"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ArrowLeft, Percent } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Category {
  slug: string;
  name_de: string;
  name_tr?: string;
}

export default function AdminBulkProductsPage() {
  const t = useTranslations("adminBulk");
  const ta = useTranslations("admin");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState("");
  const [priceB2cPercent, setPriceB2cPercent] = useState("");
  const [priceB2bPercent, setPriceB2bPercent] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [stockStatus, setStockStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!categorySlug) {
      setError(t("selectCategory"));
      return;
    }

    const b2c = priceB2cPercent.trim() ? Number(priceB2cPercent) : undefined;
    const b2b = priceB2bPercent.trim() ? Number(priceB2bPercent) : undefined;
    const hasPrice = b2c !== undefined || b2b !== undefined;
    const hasOther = isActive !== "" || stockStatus !== "";

    if (!hasPrice && !hasOther) {
      setError(t("nothingSelected"));
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { categorySlug };
      if (b2c !== undefined && !Number.isNaN(b2c)) body.priceB2cPercent = b2c;
      if (b2b !== undefined && !Number.isNaN(b2b)) body.priceB2bPercent = b2b;
      if (isActive === "true") body.isActive = true;
      if (isActive === "false") body.isActive = false;
      if (stockStatus) body.stockStatus = stockStatus;

      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? ta("error"));
        return;
      }
      setResult({ updated: data.updated ?? 0, total: data.total ?? 0 });
    } catch {
      setError(ta("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-bosporus font-semibold mb-4 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        {ta("backToProducts")}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-bosporus-light flex items-center justify-center">
          <Percent className="w-5 h-5 text-bosporus" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-metro-navy">{t("title")}</h1>
          <p className="text-sm text-bosporus-muted">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="!rounded-2xl max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">{t("category")}</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="field-input"
              required
            >
              <option value="">{t("selectCategory")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name_de}{c.name_tr ? ` / ${c.name_tr}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t("b2cPercent")}
              type="number"
              step="0.1"
              placeholder="10"
              value={priceB2cPercent}
              onChange={(e) => setPriceB2cPercent(e.target.value)}
            />
            <Input
              label={t("b2bPercent")}
              type="number"
              step="0.1"
              placeholder="-5"
              value={priceB2bPercent}
              onChange={(e) => setPriceB2bPercent(e.target.value)}
            />
          </div>
          <p className="text-xs text-bosporus-muted -mt-2">{t("percentHint")}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">{t("activeStatus")}</label>
              <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="field-input">
                <option value="">{t("noChange")}</option>
                <option value="true">{ta("active")}</option>
                <option value="false">{ta("inactive")}</option>
              </select>
            </div>
            <div>
              <label className="field-label">{t("stockStatus")}</label>
              <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="field-input">
                <option value="">{t("noChange")}</option>
                <option value="in_stock">{t("inStock")}</option>
                <option value="low_stock">{t("lowStock")}</option>
                <option value="out_of_stock">{ta("outOfStock")}</option>
              </select>
            </div>
          </div>

          {error && <p className="text-bosporus-red text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          {result && (
            <p className="text-green-700 text-sm bg-green-50 p-3 rounded-xl font-semibold">
              {t("success", { updated: result.updated, total: result.total })}
            </p>
          )}

          <Button type="submit" loading={loading} size="lg">
            {t("apply")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
