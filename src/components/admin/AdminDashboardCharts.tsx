"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/pricing";

interface DailySale {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  name: string;
  sku: string;
  qty: number;
  revenue: number;
}

export function AdminDashboardCharts() {
  const t = useTranslations("adminDashboard");
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekOrders, setWeekOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setDailySales(d.dailySales ?? []);
        setTopProducts(d.topProducts ?? []);
        setWeekTotal(d.weekTotal ?? 0);
        setWeekOrders(d.weekOrders ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-bosporus" />
      </div>
    );
  }

  const maxTotal = Math.max(...dailySales.map((d) => d.total), 1);
  const maxQty = Math.max(...topProducts.map((p) => p.qty), 1);

  const formatDay = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 mb-8">
      <Card className="!rounded-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-lg text-metro-navy">{t("dailySales")}</h2>
            <p className="text-xs text-bosporus-muted">{t("last14Days")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-bosporus-muted flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5" />
              {t("periodTotal")}
            </p>
            <p className="font-extrabold text-bosporus">{formatPrice(weekTotal, "de")}</p>
            <p className="text-xs text-bosporus-muted">{t("orderCount", { count: weekOrders })}</p>
          </div>
        </div>

        <div className="flex items-end gap-1 h-40">
          {dailySales.map((d) => {
            const h = d.total > 0 ? Math.max(8, (d.total / maxTotal) * 100) : 4;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
                <span className="text-[10px] text-bosporus-muted opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">
                  {formatPrice(d.total, "de")}
                </span>
                <div
                  className="w-full rounded-t-md bg-bosporus/80 hover:bg-bosporus transition-colors"
                  style={{ height: `${h}%` }}
                  title={`${formatDay(d.date)}: ${formatPrice(d.total, "de")} (${d.count})`}
                />
                <span className="text-[9px] text-bosporus-muted truncate w-full text-center">{formatDay(d.date)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg text-metro-navy mb-1">{t("topProducts")}</h2>
        <p className="text-xs text-bosporus-muted mb-4">{t("last14Days")}</p>

        {topProducts.length === 0 ? (
          <p className="text-sm text-bosporus-muted py-8 text-center">{t("noSalesYet")}</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-bosporus-light text-bosporus text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-metro-navy truncate">{p.name}</p>
                  <p className="text-xs text-bosporus-muted">{p.sku}</p>
                  <div className="mt-1 h-2 bg-bosporus-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bosporus-yellow rounded-full"
                      style={{ width: `${(p.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-metro-navy">{p.qty}×</p>
                  <p className="text-xs text-bosporus-muted">{formatPrice(p.revenue, "de")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
