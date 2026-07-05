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

  const load = () => {
    Promise.all([
      fetch("/api/admin/campaigns").then((r) => r.json()),
      fetch("/api/admin/email-logs").then((r) => r.json()),
    ]).then(([c, l]) => {
      setCampaigns(c.campaigns ?? []);
      setEmailLogs(l.logs ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

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
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => sendCampaign(false)}>Taslak Kaydet</Button>
              <Button onClick={() => sendCampaign(true)}><Send className="w-4 h-4" /> Şimdi Gönder</Button>
            </div>
            <p className="text-xs text-bosporus-muted">SMTP ayarları Vercel&apos;de olmalı (SMTP_HOST, SMTP_USER, SMTP_PASS)</p>
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
    </div>
  );
}
