"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Zone {
  id: string;
  name_de: string;
  name_tr: string;
  zip_prefixes: string[];
  min_order_amount: number;
  delivery_days: number[];
  sort_order: number;
}

interface Slot {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_active: boolean;
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export default function AdminDeliveryPage() {
  const t = useTranslations("admin");
  const [zones, setZones] = useState<Zone[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/delivery")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.zones ?? []);
        setSlots(d.slots ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const saveZone = async (zone: Partial<Zone> & { id?: string }) => {
    const method = zone.id ? "PATCH" : "POST";
    const res = await fetch("/api/admin/delivery", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "zone",
        ...zone,
        zip_prefixes: typeof zone.zip_prefixes === "string"
          ? (zone.zip_prefixes as unknown as string).split(",").map((s) => s.trim()).filter(Boolean)
          : zone.zip_prefixes,
      }),
    });
    if (res.ok) { setMsg("Kaydedildi"); load(); }
  };

  const saveSlot = async (slot: Partial<Slot> & { id?: string }) => {
    const method = slot.id ? "PATCH" : "POST";
    const res = await fetch("/api/admin/delivery", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "slot", ...slot }),
    });
    if (res.ok) { setMsg("Kaydedildi"); load(); }
  };

  const deleteItem = async (type: "zone" | "slot", id: string) => {
    if (!confirm("Silinsin mi?")) return;
    await fetch(`/api/admin/delivery?type=${type}&id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-bosporus" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-6">{t("delivery")}</h1>
      {msg && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm">{msg}</div>}

      <Card className="!rounded-2xl mb-6">
        <h2 className="font-bold mb-3">Teslimat kuralları (km)</h2>
        <div className="text-sm text-bosporus-muted space-y-2">
          <p><strong>B2C teslimat:</strong> Min. 100 € · 250 € üzeri ücretsiz · Max 40 km · Ücretler: 10→20€, 20→30€, 30→40€, 40→50€</p>
          <p><strong>B2B teslimat:</strong> Min. 1.000 € · 2.500 € üzeri ücretsiz · Max 50 km · Ücretler: 10→20€, 20→30€, 30→40€, 40→50€, 50→60€</p>
          <p><strong>Gel-al:</strong> B2C min. 50 € · B2B min. 500 €</p>
          <p className="text-xs">Bu değerler veritabanında <code>delivery_settings</code> tablosundan okunur. Değiştirmek için Supabase veya migration kullanın.</p>
        </div>
      </Card>

      <Card className="!rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">{t("deliveryZones")}</h2>
          <Button size="sm" variant="outline" onClick={() => saveZone({ name_de: "Neue Zone", name_tr: "Yeni bölge", zip_prefixes: [], min_order_amount: 150, delivery_days: [1,2,3,4,5,6], sort_order: zones.length })}>
            <Plus className="w-4 h-4" /> Ekle
          </Button>
        </div>
        <div className="space-y-4">
          {zones.map((z) => (
            <div key={z.id} className="border border-bosporus-gray-200 rounded-xl p-4 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input label="DE" value={z.name_de} onChange={(e) => setZones(zones.map((x) => x.id === z.id ? { ...x, name_de: e.target.value } : x))} />
                <Input label="TR" value={z.name_tr} onChange={(e) => setZones(zones.map((x) => x.id === z.id ? { ...x, name_tr: e.target.value } : x))} />
                <Input label="PLZ Prefix (virgülle)" value={z.zip_prefixes.join(", ")} onChange={(e) => setZones(zones.map((x) => x.id === z.id ? { ...x, zip_prefixes: e.target.value.split(",").map((s) => s.trim()) } : x))} />
                <Input label="Min. sipariş €" type="number" value={z.min_order_amount} onChange={(e) => setZones(zones.map((x) => x.id === z.id ? { ...x, min_order_amount: Number(e.target.value) } : x))} />
                <Input label="Günler (0-6)" value={z.delivery_days.join(",")} onChange={(e) => setZones(zones.map((x) => x.id === z.id ? { ...x, delivery_days: e.target.value.split(",").map(Number).filter((n) => !isNaN(n)) } : x))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveZone(z)}>{t("overview") === "Übersicht" ? "Speichern" : "Kaydet"}</Button>
                <Button size="sm" variant="outline" onClick={() => deleteItem("zone", z.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">{t("pickupSlots")}</h2>
          <Button size="sm" variant="outline" onClick={() => saveSlot({ weekday: 1, start_time: "09:00", end_time: "09:30", max_orders: 10, is_active: true })}>
            <Plus className="w-4 h-4" /> Ekle
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2 text-sm">
          {slots.slice(0, 50).map((s) => (
            <div key={s.id} className="flex items-center gap-2 border-b border-bosporus-gray-100 py-2">
              <span className="w-8 font-bold">{WEEKDAYS[s.weekday]}</span>
              <span>{String(s.start_time).slice(0,5)} – {String(s.end_time).slice(0,5)}</span>
              <span className="text-bosporus-muted">max {s.max_orders}</span>
              <button type="button" onClick={() => deleteItem("slot", s.id)} className="ml-auto text-bosporus-red"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {slots.length > 50 && <p className="text-xs text-bosporus-muted">+{slots.length - 50} slot daha…</p>}
        </div>
      </Card>
    </div>
  );
}
