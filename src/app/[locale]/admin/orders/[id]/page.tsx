"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, ArrowLeft, User, MapPin, Package, FileDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Yeni sipariş" },
  { value: "preparing", label: "Hazırlanıyor" },
  { value: "ready", label: "Teslime hazır" },
  { value: "out_for_delivery", label: "Yolda" },
  { value: "delivered", label: "Teslim edildi" },
  { value: "cancelled", label: "İptal" },
];

interface OrderItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_gross: number;
  line_total_gross: number;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: OrderStatus;
  order_type: string;
  is_b2b: boolean;
  customer_name: string;
  customer_email: string;
  subtotal_net: number;
  tax_amount: number;
  total_gross: number;
  delivery_zip_code: string | null;
  delivery_address: { raw?: string; street?: string; zip?: string; city?: string } | null;
  pickup_date: string | null;
  pickup_slot_label: string | null;
  notes: string | null;
  created_at: string;
  user_id: string | null;
}

interface CustomerProfile {
  id: string;
  email: string;
}

export default function AdminOrderDetailPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order);
        setItems(d.items ?? []);
        setProfile(d.profile);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMsg("Durum güncellendi — müşteriye e-posta gönderildi (SMTP ayarlıysa)");
      load();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  if (!order) return <p className="text-center py-12 text-bosporus-muted">Sipariş bulunamadı</p>;

  const address = order.delivery_address;

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-4">
        <ArrowLeft className="w-4 h-4" /> Siparişlere dön
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-metro-navy">{order.order_number}</h1>
          <p className="text-sm text-bosporus-muted">
            {new Date(order.created_at).toLocaleString("tr-TR")}
            {order.is_b2b ? " · B2B" : " · B2C"}
            {" · "}{order.order_type === "delivery" ? "Teslimat" : "Gel-Al"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <a
            href={`/api/admin/orders/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bosporus text-white rounded-xl text-sm font-bold hover:bg-bosporus-dark"
          >
            <FileDown className="w-4 h-4" />
            {t("downloadPdf")}
          </a>
          <select
          value={order.status}
          onChange={(e) => updateStatus(e.target.value as OrderStatus)}
          className="field-input !w-auto !min-h-11 font-semibold"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="!rounded-2xl">
          <h2 className="font-bold flex items-center gap-2 mb-3"><User className="w-4 h-4" /> Müşteri</h2>
          <p className="font-semibold">{order.customer_name}</p>
          <p className="text-sm text-bosporus-muted">{order.customer_email}</p>
          {profile && (
            <Link
              href={`/admin/customers/${profile.id}`}
              className="inline-block mt-3 text-sm font-bold text-bosporus hover:underline"
            >
              Üye profiline git →
            </Link>
          )}
        </Card>

        <Card className="!rounded-2xl">
          <h2 className="font-bold flex items-center gap-2 mb-3"><MapPin className="w-4 h-4" /> Teslimat / Gel-Al</h2>
          {order.order_type === "delivery" ? (
            <>
              <p className="text-sm">PLZ: {order.delivery_zip_code}</p>
              <p className="text-sm mt-1">{address?.raw ?? [address?.street, address?.zip, address?.city].filter(Boolean).join(", ")}</p>
            </>
          ) : (
            <>
              <p className="text-sm">Tarih: {order.pickup_date}</p>
              <p className="text-sm">Saat: {order.pickup_slot_label}</p>
            </>
          )}
          {order.notes && <p className="text-sm mt-2 text-bosporus-muted">Not: {order.notes}</p>}
        </Card>
      </div>

      <Card className="!rounded-2xl">
        <h2 className="font-bold flex items-center gap-2 mb-4"><Package className="w-4 h-4" /> Sipariş Kalemleri</h2>
        <div className="divide-y divide-bosporus-gray-100">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-bosporus-muted text-xs">{item.product_sku} · {item.quantity} adet</p>
              </div>
              <p className="font-bold">{Number(item.line_total_gross).toFixed(2)} €</p>
            </div>
          ))}
        </div>
        <div className="border-t border-bosporus-gray-200 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Ara toplam (net)</span><span>{Number(order.subtotal_net).toFixed(2)} €</span></div>
          <div className="flex justify-between"><span>KDV</span><span>{Number(order.tax_amount).toFixed(2)} €</span></div>
          <div className="flex justify-between font-extrabold text-lg text-bosporus pt-2">
            <span>Toplam</span><span>{Number(order.total_gross).toFixed(2)} €</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
