"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function AdminEmailsPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [emailLogs, setEmailLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [campSubject, setCampSubject] = useState("");
  const [campHeadline, setCampHeadline] = useState("");
  const [campBody, setCampBody] = useState("");
  const [campAudience, setCampAudience] = useState("all");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [waStatus, setWaStatus] = useState<{
    configured: boolean;
    adminCount: number;
    orderTemplate: string | null;
    statusTemplate: string | null;
  } | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [waTesting, setWaTesting] = useState(false);

  const testSmtp = async () => {
    setSmtpTesting(true);
    setMsg("");
    const res = await fetch("/api/admin/test-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    setSmtpTesting(false);
    if (res.ok) setMsg(`SMTP testi gönderildi → ${data.to}`);
    else setMsg(data.error ?? "SMTP testi başarısız");
    load();
  };

  const testWhatsApp = async (mode: "text" | "template") => {
    setWaTesting(true);
    setMsg("");
    const res = await fetch("/api/admin/whatsapp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: waPhone, mode }),
    });
    const data = await res.json();
    setWaTesting(false);
    if (res.ok) setMsg(`WhatsApp testi gitti (${mode}) → ${data.to}`);
    else setMsg(data.error ?? "WhatsApp testi başarısız");
  };

  const load = () => {
    Promise.all([
      fetch("/api/admin/campaigns").then((r) => r.json()),
      fetch("/api/admin/email-logs").then((r) => r.json()),
      fetch("/api/admin/whatsapp/test").then((r) => r.json()).catch(() => null),
    ]).then(([c, l, wa]) => {
      setCampaigns(c.campaigns ?? []);
      setEmailLogs(l.logs ?? []);
      if (wa && typeof wa.configured === "boolean") setWaStatus(wa);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const previewCampaign = async () => {
    const res = await fetch("/api/admin/campaigns/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: campHeadline || campSubject,
        bodyHtml: campBody.replace(/\n/g, "<br>"),
        locale: "tr",
      }),
    });
    const data = await res.json();
    if (data.html) {
      setPreviewHtml(data.html);
      setPreviewOpen(true);
    }
  };

  const sendCampaign = async (sendNow: boolean, campaignId?: string) => {
    if (campaignId) {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/send`, { method: "POST" });
      const data = await res.json();
      setMsg(`Gönderildi: ${data.sent ?? 0}, Hata: ${data.failed ?? 0}`);
      load();
      return;
    }
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: campSubject,
        headline: campHeadline,
        bodyHtml: campBody.replace(/\n/g, "<br>"),
        audience: campAudience,
        sendNow,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? "Hata"); return; }
    setMsg(sendNow ? `Kampanya gönderildi: ${data.sent ?? 0} e-posta` : "Taslak kaydedildi");
    setCampSubject(""); setCampHeadline(""); setCampBody("");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">E-posta & Kampanyalar</h1>
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm whitespace-pre-wrap">{msg}</div>}

      <Card className="!rounded-2xl mb-6">
        <h2 className="font-bold text-lg mb-2">WhatsApp bildirimleri</h2>
        <p className="text-sm text-bosporus-muted mb-4">
          Sipariş gelince mağaza telefonlarına ve (numara verdiyse) müşteriye otomatik mesaj gider.
        </p>
        {waStatus && (
          <ul className="text-sm mb-4 space-y-1">
            <li>
              Bağlantı:{" "}
              <strong className={waStatus.configured ? "text-green-700" : "text-bosporus-red"}>
                {waStatus.configured ? "Hazır" : "Henüz bağlı değil"}
              </strong>
            </li>
            <li>Yönetici numarası: {waStatus.adminCount}</li>
            <li>Sipariş şablonu: {waStatus.orderTemplate ?? "— (Vercel: WHATSAPP_TEMPLATE_ORDER_PLACED)"}</li>
            <li>Durum şablonu: {waStatus.statusTemplate ?? "— (opsiyonel)"}</li>
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Input
              label="Test telefonu"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="+49 221 ..."
            />
          </div>
          <Button variant="outline" onClick={() => testWhatsApp("text")} loading={waTesting} disabled={!waPhone.trim()}>
            Metin test
          </Button>
          <Button onClick={() => testWhatsApp("template")} loading={waTesting} disabled={!waPhone.trim()}>
            Şablon test
          </Button>
        </div>
        <p className="text-xs text-bosporus-muted mt-3">
          Vercel: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ADMIN_PHONES
          <br />
          Müşteri mesajı için Meta’da onaylı şablon + WHATSAPP_TEMPLATE_ORDER_PLACED gerekir.
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="!rounded-2xl">
          <h2 className="font-bold text-lg mb-4">Kampanya Gönder</h2>
          <div className="space-y-3">
            <Input label="Konu" value={campSubject} onChange={(e) => setCampSubject(e.target.value)} placeholder="Bu hafta içeceklerde %30 indirim" />
            <Input label="Başlık" value={campHeadline} onChange={(e) => setCampHeadline(e.target.value)} />
            <Textarea label="İçerik" value={campBody} onChange={(e) => setCampBody(e.target.value)} rows={6} />
            <div>
              <label className="field-label">Hedef Kitle</label>
              <select value={campAudience} onChange={(e) => setCampAudience(e.target.value)} className="field-input">
                <option value="all">Tüm müşteriler</option>
                <option value="b2c">Sadece bireysel</option>
                <option value="b2b">Tüm B2B</option>
                <option value="b2b_approved">Onaylı B2B</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={testSmtp} loading={smtpTesting}>SMTP testi</Button>
              <Button variant="outline" onClick={previewCampaign}>Önizleme</Button>
              <Button variant="outline" onClick={() => sendCampaign(false)}>Taslak Kaydet</Button>
              <Button onClick={() => sendCampaign(true)}><Send className="w-4 h-4" /> Şimdi Gönder</Button>
            </div>
            <p className="text-xs text-bosporus-muted">
              IONOS: smtp.ionos.de · port 587 · TLS · kullanıcı info@bosporus-gmbh.com
              <br />
              Vercel ortam değişkenleri: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="sm" className="!rounded-2xl">
            <h3 className="font-bold mb-3">Son Kampanyalar</h3>
            {campaigns.slice(0, 5).map((c) => (
              <div key={c.id as string} className="py-2 border-b border-bosporus-gray-100 last:border-0 text-sm">
                <p className="font-semibold">{c.subject as string}</p>
                <p className="text-bosporus-muted text-xs">
                  {c.sent_at ? `Gönderildi: ${c.sent_count} · ` : "Taslak · "}{c.audience as string}
                </p>
                {!c.sent_at && (
                  <Button size="sm" className="mt-2" onClick={() => sendCampaign(true, c.id as string)}>Gönder</Button>
                )}
              </div>
            ))}
          </Card>
          <Card padding="sm" className="!rounded-2xl">
            <h3 className="font-bold mb-3">E-posta Log</h3>
            <div className="max-h-64 overflow-y-auto text-xs space-y-1">
              {emailLogs.slice(0, 30).map((l) => (
                <div key={l.id as string} className="flex justify-between gap-2 py-1 border-b border-bosporus-gray-50">
                  <span className="truncate">{l.recipient_email as string}</span>
                  <span className={cn("shrink-0 font-bold", l.status === "sent" ? "text-green-600" : l.status === "failed" ? "text-bosporus-red" : "text-bosporus-muted")}>
                    {l.template_type as string}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">E-posta önizleme</h3>
            <iframe title="preview" srcDoc={previewHtml} className="w-full h-[60vh] border border-bosporus-gray-200 rounded-xl" />
            <Button className="mt-3" onClick={() => setPreviewOpen(false)}>Kapat</Button>
          </div>
        </div>
      )}
    </div>
  );
}
