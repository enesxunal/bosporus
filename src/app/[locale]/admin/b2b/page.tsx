"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface B2bRow {
  id: string;
  email: string;
  company_name: string;
  company_address: string;
  vat_id: string;
  created_at: string;
}

export default function AdminB2bPage() {
  const [pending, setPending] = useState<B2bRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/b2b")
      .then((r) => r.json())
      .then((d) => setPending(d.profiles ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/b2b/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (action === "approve") {
        setMsg(
          data.emailSent
            ? `Onaylandı — bilgilendirme maili gönderildi${data.emailTo ? ` (${data.emailTo})` : ""}`
            : "Onaylandı — mail gönderilemedi (SMTP / e-posta adresini kontrol edin)"
        );
      } else {
        setMsg(
          data.emailSent
            ? "Başvuru reddedildi — bilgilendirme maili gönderildi"
            : "Başvuru reddedildi"
        );
      }
      load();
    } else {
      setMsg("İşlem başarısız");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">B2B Onay Bekleyenler</h1>
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}
      {pending.length === 0 ? (
        <p className="text-center text-bosporus-muted py-12">Bekleyen başvuru yok</p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <Card key={p.id} padding="md" className="!rounded-2xl">
              <p className="font-bold">{p.company_name}</p>
              <p className="text-sm text-bosporus-muted">{p.email} · {p.vat_id}</p>
              <p className="text-sm mt-1">{p.company_address}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => approve(p.id, "approve")}>
                  <CheckCircle className="w-4 h-4" /> Onayla
                </Button>
                <Button size="sm" variant="outline" onClick={() => approve(p.id, "reject")}>
                  <XCircle className="w-4 h-4" /> Reddet
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
