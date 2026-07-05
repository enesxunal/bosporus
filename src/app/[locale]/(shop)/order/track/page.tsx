"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search, Package, Loader2, FileDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS: Record<OrderStatus, { de: string; tr: string }> = {
  pending: { de: "Eingegangen", tr: "Alındı" },
  paid: { de: "Bezahlt", tr: "Ödendi" },
  preparing: { de: "In Vorbereitung", tr: "Hazırlanıyor" },
  ready: { de: "Abholbereit", tr: "Hazır" },
  out_for_delivery: { de: "Unterwegs", tr: "Yolda" },
  delivered: { de: "Geliefert", tr: "Teslim edildi" },
  cancelled: { de: "Storniert", tr: "İptal" },
};

export default function OrderTrackPage() {
  return (
    <Suspense fallback={<div className="page-narrow py-20 text-center text-bosporus-muted">…</div>}>
      <OrderTrackContent />
    </Suspense>
  );
}

function OrderTrackContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("orderTrack");
  const locale = useLocale() as "de" | "tr";
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<{
    order: Record<string, unknown>;
    items: { product_name: string; quantity: number; line_total_gross: number }[];
  } | null>(null);

  useEffect(() => {
    const prefill = searchParams.get("order");
    if (prefill) setOrderNumber(prefill);
  }, [searchParams]);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("error"));
      return;
    }
    setResult(data);
  };

  const downloadInvoice = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? t("invoiceError"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orderNumber.trim().toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("invoiceError"));
    } finally {
      setDownloading(false);
    }
  };

  const order = result?.order;

  return (
    <div className="page-narrow py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bosporus-light mb-4">
          <Package className="w-7 h-7 text-bosporus" />
        </div>
        <h1 className="text-2xl font-extrabold text-bosporus-gray-800">{t("title")}</h1>
        <p className="text-bosporus-muted text-sm mt-2">{t("desc")}</p>
      </div>

      <Card className="!rounded-2xl mb-6">
        <form onSubmit={track} className="space-y-4">
          <Input
            label={t("orderNumber")}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="BOS-20260705-4199"
            required
          />
          <Input
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-bosporus-red font-medium">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {t("submit")}
          </Button>
        </form>
      </Card>

      {order && (
        <Card className="!rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-mono font-bold text-lg text-bosporus">{order.order_number as string}</p>
              <p className="text-sm text-bosporus-muted">
                {new Date(order.created_at as string).toLocaleString(locale === "de" ? "de-DE" : "tr-TR")}
              </p>
            </div>
            <span className={cn("text-xs font-bold px-3 py-1 rounded-full bg-bosporus-light text-bosporus")}>
              {STATUS[order.status as OrderStatus]?.[locale] ?? (order.status as string)}
            </span>
          </div>

          <div className="divide-y divide-bosporus-gray-100 mb-4">
            {(result?.items ?? []).map((item, i) => (
              <div key={i} className="flex justify-between py-3 text-sm">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-semibold">{formatPrice(Number(item.line_total_gross), locale)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-extrabold text-lg border-t border-bosporus-gray-200 pt-4">
            <div className="flex justify-between sm:gap-8 flex-1">
              <span>{locale === "de" ? "Gesamt" : "Toplam"}</span>
              <span className="text-bosporus">{formatPrice(Number(order.total_gross), locale)}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={downloadInvoice}
              disabled={downloading}
              className="shrink-0"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {t("downloadPdf")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
