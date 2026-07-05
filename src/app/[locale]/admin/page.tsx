"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Package, Users, ShoppingBag, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const t = useTranslations("adminDashboard");
  const ta = useTranslations("admin");
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
    { label: t("totalOrders"), value: stats.totalOrders ?? 0, href: "/admin/orders", icon: Package, color: "text-bosporus" },
    { label: t("pendingB2b"), value: stats.pendingB2b ?? 0, href: "/admin/b2b", icon: Building2, color: "text-orange-600" },
    { label: t("totalProducts"), value: stats.totalProducts ?? 0, href: "/admin/products", icon: ShoppingBag, color: "text-green-600" },
    { label: t("emailsSent"), value: stats.emailsSent ?? 0, href: "/admin/emails", icon: Users, color: "text-purple-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">{ta("overview")}</h1>
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
        <h2 className="font-bold text-lg mb-3">{t("quickStart")}</h2>
        <ul className="text-sm text-bosporus-muted space-y-2">
          <li>1. <Link href="/admin/products" className="text-bosporus font-semibold hover:underline">{ta("products")}</Link> — {t("step1")}</li>
          <li>2. {t("step2")}</li>
          <li>3. <Link href="/admin/orders" className="text-bosporus font-semibold hover:underline">{ta("orders")}</Link> — {t("step3")}</li>
          <li>4. <Link href="/admin/customers" className="text-bosporus font-semibold hover:underline">{ta("customers")}</Link> — {t("step4")}</li>
        </ul>
      </Card>
    </div>
  );
}
