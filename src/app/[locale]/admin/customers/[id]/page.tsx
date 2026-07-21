"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Loader2, ArrowLeft, Mail, Phone, Building2, MailCheck, MailWarning, Clock, Send, Pencil, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Yeni", paid: "Ödendi", preparing: "Hazırlanıyor", ready: "Hazır",
  out_for_delivery: "Yolda", delivered: "Teslim", cancelled: "İptal",
};

interface Profile {
  id: string;
  email: string;
  role: string;
  company_name: string | null;
  company_address: string | null;
  vat_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  email_confirmed: boolean;
  last_sign_in_at: string | null;
}

interface Address {
  id: string;
  label: string;
  street: string;
  zip_code: string;
  city: string;
  is_default: boolean;
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setOrders(d.orders ?? []);
        setAddresses(d.addresses ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startEditEmail = () => {
    setEmailValue(profile?.email ?? "");
    setEmailMsg(null);
    setEditingEmail(true);
  };

  const saveEmail = async () => {
    if (savingEmail) return;
    setSavingEmail(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setProfile((p) => (p ? { ...p, email: data.email ?? emailValue.trim(), email_confirmed: false } : p));
        setEditingEmail(false);
        setEmailMsg({ type: "ok", text: "E-posta güncellendi. Artık onay mailini gönderebilirsiniz." });
      } else {
        setEmailMsg({ type: "err", text: data.error ?? "E-posta güncellenemedi." });
      }
    } catch {
      setEmailMsg({ type: "err", text: "E-posta güncellenemedi." });
    } finally {
      setSavingEmail(false);
    }
  };

  const resendVerification = async () => {
    if (resending) return;
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/resend-verification`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendMsg({ type: "ok", text: "Onay maili tekrar gönderildi." });
      } else {
        setResendMsg({ type: "err", text: data.error ?? "Mail gönderilemedi." });
      }
    } catch {
      setResendMsg({ type: "err", text: "Mail gönderilemedi." });
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  if (!profile) return <p className="text-center py-12 text-bosporus-muted">Üye bulunamadı</p>;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.company_name || "—";

  return (
    <div>
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-4">
        <ArrowLeft className="w-4 h-4" /> Üyelere dön
      </Link>

      <h1 className="text-2xl font-extrabold text-metro-navy mb-1">{name}</h1>
      <p className="text-sm text-bosporus-muted mb-6">
        Üye olma: {new Date(profile.created_at).toLocaleDateString("tr-TR")}
      </p>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="!rounded-2xl space-y-2">
          {editingEmail ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-bosporus-muted shrink-0" />
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="field-input !h-9 flex-1 text-sm"
                  placeholder="ornek@mail.com"
                  autoFocus
                />
                <Button size="sm" onClick={saveEmail} disabled={savingEmail}>
                  {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingEmail(false)} disabled={savingEmail}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-bosporus-muted" />
              <span className="break-all">{profile.email}</span>
              {profile.email_confirmed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5">
                  <MailCheck className="w-3 h-3" /> Onaylı
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5">
                  <MailWarning className="w-3 h-3" /> Onaysız
                </span>
              )}
              <button
                onClick={startEditEmail}
                className="ml-auto inline-flex items-center gap-1 text-xs text-bosporus-muted hover:text-bosporus shrink-0"
                title="E-postayı düzenle"
              >
                <Pencil className="w-3.5 h-3.5" /> Düzelt
              </button>
            </p>
          )}
          {emailMsg && (
            <p className={cn("text-xs", emailMsg.type === "ok" ? "text-green-600" : "text-red-600")}>
              {emailMsg.text}
            </p>
          )}
          <p className="flex items-center gap-2 text-sm text-bosporus-muted">
            <Clock className="w-4 h-4" />
            {profile.last_sign_in_at
              ? `Son giriş: ${new Date(profile.last_sign_in_at).toLocaleString("tr-TR")}`
              : "Hiç giriş yapmadı"}
          </p>
          {!profile.email_confirmed && (
            <div className="pt-1">
              <Button size="sm" variant="outline" onClick={resendVerification} disabled={resending}>
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Onay mailini tekrar gönder
              </Button>
              {resendMsg && (
                <p className={cn("text-xs mt-2", resendMsg.type === "ok" ? "text-green-600" : "text-red-600")}>
                  {resendMsg.text}
                </p>
              )}
            </div>
          )}
          {profile.phone && <p className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-bosporus-muted" />{profile.phone}</p>}
          {profile.company_name && (
            <p className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-bosporus-muted" />{profile.company_name}</p>
          )}
          {profile.vat_id && <p className="text-sm text-bosporus-muted">USt-IdNr: {profile.vat_id}</p>}
          {profile.company_address && <p className="text-sm text-bosporus-muted">{profile.company_address}</p>}
        </Card>

        <Card className="!rounded-2xl">
          <h2 className="font-bold mb-3">Kayıtlı Adresler</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-bosporus-muted">Kayıtlı adres yok</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="text-sm py-2 border-b border-bosporus-gray-100 last:border-0">
                <p className="font-semibold">{a.label}{a.is_default ? " (Varsayılan)" : ""}</p>
                <p className="text-bosporus-muted">{a.street}, {a.zip_code} {a.city}</p>
              </div>
            ))
          )}
        </Card>
      </div>

      <h2 className="font-bold text-lg mb-3">Sipariş Geçmişi ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-bosporus-muted">Henüz sipariş yok</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id as string} href={`/admin/orders/${o.id as string}`}>
              <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-bosporus">{o.order_number as string}</p>
                    <p className="text-xs text-bosporus-muted">{new Date(o.created_at as string).toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Number(o.total_gross).toFixed(2)} €</p>
                    <span className={cn("text-xs font-bold", o.status === "delivered" ? "text-green-600" : "text-bosporus-muted")}>
                      {STATUS_LABELS[o.status as OrderStatus] ?? o.status as string}
                    </span>
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
