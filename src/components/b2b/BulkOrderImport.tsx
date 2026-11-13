"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { FileUp, ClipboardPaste, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { parseBulkOrderText } from "@/lib/bulk-order-import";
import type { Product } from "@/lib/types";
import { isB2BApproved } from "@/lib/types";
import { useAuthOptional } from "@/contexts/AuthContext";
import { useCart } from "@/stores/cart";
import { buildCartItemFromProduct } from "@/lib/pfand";
import { getProductName } from "@/lib/product-display";
import { formatPrice, getDisplayPrice } from "@/lib/pricing";
import { trackAddToCart } from "@/lib/analytics";
import { trackApprovedB2bAddToCart, trackQuickOrderUsed } from "@/lib/b2b-funnel-client";

type PreparedRow = { product: Product; quantity: number };
const MAX_FILE = 24_000;

export function BulkOrderImport() {
  const locale = useLocale() as "de" | "tr";
  const tr = locale === "tr";
  const auth = useAuthOptional();
  const profile = auth?.b2bProfile ?? auth?.profile ?? null;
  const approved = isB2BApproved(profile);
  const [raw, setRaw] = useState("");
  const [prepared, setPrepared] = useState<PreparedRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  if (!approved) return null;

  const updateRaw = (value: string) => {
    setRaw(value);
    setPrepared([]);
    setMissing([]);
    setErrors([]);
    setAdded(false);
  };

  const validate = async () => {
    const parsed = parseBulkOrderText(raw);
    setErrors(parsed.errors);
    setPrepared([]);
    setMissing([]);
    setAdded(false);
    if (parsed.errors.length) return;
    setBusy(true);
    try {
      const response = await fetch("/api/catalog/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed.items }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { found?: PreparedRow[]; missing?: string[] };
      setPrepared(Array.isArray(result.found) ? result.found : []);
      setMissing(Array.isArray(result.missing) ? result.missing : []);
    } catch {
      setErrors([tr ? "Ürünler doğrulanamadı, yeniden deneyin." : "Artikel konnten nicht geprüft werden. Bitte erneut versuchen."]);
    } finally {
      setBusy(false);
    }
  };

  const addValidated = () => {
    if (!prepared.length || busy) return;
    for (const { product, quantity } of prepared) {
      const price = getDisplayPrice(product, profile);
      addItem(buildCartItemFromProduct(product, quantity, profile, getProductName(product, locale)));
      trackAddToCart({
        item_id: product.sku,
        item_name: product.name_de,
        price: price.amount,
        quantity,
      });
      trackApprovedB2bAddToCart({
        productId: product.id,
        quantity,
        cartSubtotal: useCart.getState().subtotalGross(),
      });
    }
    trackQuickOrderUsed(prepared.length);
    setAdded(true);
    setPrepared([]);
    setMissing([]);
    setRaw("");
  };

  return (
    <details className="mb-6 rounded-2xl border border-bosporus/20 bg-bosporus-light/40 p-4 sm:p-5">
      <summary className="cursor-pointer select-none font-bold text-bosporus-gray-800 flex items-center gap-2">
        <ClipboardPaste className="h-5 w-5 text-bosporus" />
        {tr ? "Excel listesinden toplu sipariş" : "Sammelbestellung aus Excel-Liste"}
      </summary>
      <div className="mt-4 space-y-3">
        <p className="text-sm text-bosporus-muted">
          {tr
            ? "Excel'den SKU ve adet sütunlarını kopyalayıp yapıştırın. CSV/TSV de yükleyebilirsiniz. En fazla 100 farklı ürün."
            : "SKU- und Mengenspalten aus Excel kopieren und einfügen oder CSV/TSV hochladen. Maximal 100 unterschiedliche Artikel."}
        </p>
        <label htmlFor="bulk-order-input" className="sr-only">
          {tr ? "SKU ve adet listesi" : "SKU und Menge"}
        </label>
        <textarea
          id="bulk-order-input"
          rows={4}
          spellCheck={false}
          value={raw}
          onChange={(e) => updateRaw(e.target.value)}
          className="w-full rounded-xl border border-bosporus-gray-200 bg-white p-3 font-mono text-sm"
          placeholder={"SKU\tMenge\ntiger-chips-paprika-90gr\t2"}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-bosporus-gray-200 bg-white px-3 py-2 text-sm font-semibold text-bosporus">
            <FileUp className="w-4 h-4" />
            {tr ? "CSV/TSV seç" : "CSV/TSV auswählen"}
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!file) return;
                if (file.size > MAX_FILE) {
                  setErrors([tr ? "Dosya en fazla 24 KB olabilir." : "Datei maximal 24 KB."]);
                  return;
                }
                updateRaw(await file.text());
              }}
            />
          </label>
          <button
            type="button"
            disabled={!raw.trim() || busy}
            onClick={validate}
            className="rounded-lg bg-bosporus px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? (tr ? "Kontrol ediliyor…" : "Wird geprüft…") : (tr ? "Ürünleri doğrula" : "Artikel prüfen")}
          </button>
        </div>
        {errors.length > 0 && (
          <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            {errors.slice(0, 5).join(" · ")}
          </div>
        )}
        {missing.length > 0 && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {tr ? "Bulunmayan veya satışa kapalı ürünler:" : "Nicht gefunden oder nicht verfügbar:"} {missing.join(", ")}
          </p>
        )}
        {prepared.length > 0 && (
          <div className="rounded-xl border border-bosporus-gray-200 bg-white p-3">
            <p className="font-bold mb-2 text-sm text-bosporus-gray-800">
              {prepared.length} {tr ? "doğrulanan ürün" : "geprüfte Artikel"}
            </p>
            <ul className="max-h-56 overflow-y-auto divide-y divide-bosporus-gray-100 text-sm">
              {prepared.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="font-semibold">{getProductName(product, locale)}</span>
                    <span className="block text-xs text-bosporus-muted">{product.sku} × {quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-bosporus">
                    {formatPrice(getDisplayPrice(product, profile).amount * quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addValidated}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-bosporus px-4 py-2 text-sm font-bold text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              {tr ? "Doğrulananları sepete ekle" : "Geprüfte Artikel in den Warenkorb"}
            </button>
          </div>
        )}
        {added && (
          <p role="status" className="flex items-center gap-2 text-sm font-bold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {tr ? "Ürünler sepete eklendi." : "Artikel wurden in den Warenkorb gelegt."}
          </p>
        )}
      </div>
    </details>
  );
}
