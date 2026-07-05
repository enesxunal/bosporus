"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2, Package, Users, ShoppingBag, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  const cards = [
    { label: "Toplam Sipariş", value: stats.totalOrders ?? 0, href: "/admin/orders", icon: Package, color: "text-bosporus" },
    { label: "Bekleyen B2B", value: stats.pendingB2b ?? 0, href: "/admin/b2b", icon: Building2, color: "text-orange-600" },
    { label: "Ürünler", value: stats.totalProducts ?? 0, href: "/admin/products", icon: ShoppingBag, color: "text-green-600" },
    { label: "Gönderilen E-posta", value: stats.emailsSent ?? 0, href: "/admin/emails", icon: Users, color: "text-purple-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">Genel Bakış</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card padding="md" className="!rounded-2xl hover:shadow-md transition-shadow h-full">
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <p className="text-3xl font-extrabold text-metro-navy">{value}</p>
              <p className="text-sm text-bosporus-muted mt-1">{label}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="!rounded-2xl">
        <h2 className="font-bold text-lg mb-3">Hızlı Başlangıç</h2>
        <ul className="text-sm text-bosporus-muted space-y-2">
          <li>1. <Link href="/admin/products" className="text-bosporus font-semibold hover:underline">Ürünler</Link> sayfasından ürünleri veritabanına aktarın</li>
          <li>2. Fiyat ve stok durumlarını buradan düzenleyin</li>
          <li>3. <Link href="/admin/orders" className="text-bosporus font-semibold hover:underline">Siparişlere</Link> tıklayarak detayları görün</li>
          <li>4. <Link href="/admin/customers" className="text-bosporus font-semibold hover:underline">Üyelere</Link> tıklayarak müşteri profilini açın</li>
        </ul>
      </Card>
    </div>
  );
}
