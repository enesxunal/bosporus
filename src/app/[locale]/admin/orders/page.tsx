"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Yeni",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  out_for_delivery: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  total_gross: number;
  created_at: string;
  is_b2b: boolean;
  user_id?: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">Siparişler</h1>
      {orders.length === 0 ? (
        <p className="text-center text-bosporus-muted py-12">Henüz sipariş yok</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}>
              <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-bosporus">{o.order_number}</p>
                    <p className="text-sm truncate">{o.customer_name} · {o.customer_email}</p>
                    <p className="text-xs text-bosporus-muted">
                      {new Date(o.created_at).toLocaleString("tr-TR")}
                      {o.is_b2b ? " · B2B" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="font-bold">{Number(o.total_gross).toFixed(2)} €</p>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        o.status === "delivered" ? "bg-green-100 text-green-700" :
                        o.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-bosporus-muted" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
