"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CustomerRow {
  id: string;
  email: string;
  role: string;
  display_name: string;
  company_name: string | null;
  order_count: number;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  b2c: "Bireysel",
  b2b_pending: "B2B Bekliyor",
  b2b_approved: "B2B Onaylı",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    fetch(`/api/admin/customers?${params}`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">Üyeler</h1>

      <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-posta veya isim ara..." className="field-input !pl-10" />
        </div>
        <Button type="submit">Ara</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>
      ) : customers.length === 0 ? (
        <p className="text-center text-bosporus-muted py-12">Üye bulunamadı</p>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/admin/customers/${c.id}`}>
              <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.display_name}</p>
                    <p className="text-sm text-bosporus-muted truncate">{c.email}</p>
                    <p className="text-xs text-bosporus-muted">
                      {ROLE_LABELS[c.role] ?? c.role} · {c.order_count} sipariş
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-bosporus-muted shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
