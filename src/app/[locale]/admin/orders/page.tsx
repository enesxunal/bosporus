"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search, ChevronRight, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_KEYS } from "@/lib/admin-status";

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  total_gross: number;
  created_at: string;
  is_b2b: boolean;
}

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const ts = useTranslations("account");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE = 50;

  const load = useCallback(async (fromOffset: number, append: boolean) => {
    if (fromOffset === 0) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({ limit: String(PAGE), offset: String(fromOffset) });
    if (search) params.set("q", search);
    if (status) params.set("status", status);

    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders((prev) => (append ? [...prev, ...(data.orders ?? [])] : data.orders ?? []));
    setTotal(data.total ?? 0);
    setOffset(fromOffset + (data.orders?.length ?? 0));
    setLoading(false);
    setLoadingMore(false);
  }, [search, status]);

  useEffect(() => {
    setOffset(0);
    load(0, false);
  }, [load]);

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    window.open(`/api/admin/orders/export?${params}`, "_blank");
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold text-metro-navy">{t("orders")}</h1>
        <Button type="button" variant="outline" onClick={exportCsv} className="shrink-0">
          <Download className="w-4 h-4" />
          {t("exportCsv")}
        </Button>
      </div>

      <form className="flex flex-col sm:flex-row gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchOrders")} className="field-input !pl-10" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input !w-auto">
          <option value="">{t("allStatuses")}</option>
          {(Object.keys(ORDER_STATUS_KEYS) as OrderStatus[]).map((k) => (
            <option key={k} value={k}>{ts(ORDER_STATUS_KEYS[k])}</option>
          ))}
        </select>
        <Button type="submit">{t("search")}</Button>
      </form>

      <p className="text-sm text-bosporus-muted mb-3">{orders.length} / {total}</p>

      {orders.length === 0 ? (
        <p className="text-center text-bosporus-muted py-12">{t("noResults")}</p>
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`}>
                <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-bosporus">{o.order_number}</p>
                      <p className="text-sm truncate">{o.customer_name} · {o.customer_email}</p>
                      <p className="text-xs text-bosporus-muted">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className="font-bold">{Number(o.total_gross).toFixed(2)} €</p>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", o.status === "delivered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800")}>
                          {ts(ORDER_STATUS_KEYS[o.status])}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-bosporus-muted" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {orders.length < total && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => load(offset, true)} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : t("loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
