"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  User,
  MapPin,
  Package,
  Loader2,
  CheckCircle,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/pricing";

type Tab = "profile" | "addresses" | "orders";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  role: string;
}

interface Address {
  id: string;
  label: string;
  street: string;
  zip_code: string;
  city: string;
  is_default: boolean;
}

interface OrderItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  line_total_gross: number;
}

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  total_gross: number;
  created_at: string;
  delivery_zip_code: string | null;
  delivery_address: { raw?: string } | null;
  pickup_date: string | null;
  pickup_slot_label: string | null;
  items: OrderItem[];
}

const STATUS_KEYS: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  preparing: "statusPreparing",
  ready: "statusReady",
  out_for_delivery: "statusDelivery",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

export default function AccountPage() {
  const t = useTranslations("account");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrCity, setAddrCity] = useState("Köln");
  const [addrDefault, setAddrDefault] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/login");
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      loadAll();
    });
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, addrRes, ordersRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/addresses"),
        fetch("/api/account/orders"),
      ]);

      if (profileRes.status === 401) {
        router.replace("/login");
        return;
      }

      const profileData = await profileRes.json();
      const addrData = await addrRes.json();
      const ordersData = await ordersRes.json();

      if (profileData.profile) {
        setProfile(profileData.profile);
        setFirstName(profileData.profile.first_name ?? "");
        setLastName(profileData.profile.last_name ?? "");
        setPhone(profileData.profile.phone ?? "");
      }
      setAddresses(addrData.addresses ?? []);
      setOrders(ordersData.orders ?? []);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("saveError"));
        return;
      }
      setProfile(data.profile);
      setMessage(t("saved"));
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: addrLabel || t("defaultLabel"),
          street: addrStreet,
          zipCode: addrZip,
          city: addrCity,
          isDefault: addrDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("saveError"));
        return;
      }
      const addrRes = await fetch("/api/account/addresses");
      const addrData = await addrRes.json();
      setAddresses(addrData.addresses ?? []);
      setShowAddressForm(false);
      setAddrLabel("");
      setAddrStreet("");
      setAddrZip("");
      setAddrCity("Köln");
      setAddrDefault(false);
      setMessage(t("addressAdded"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const setDefaultAddress = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === data.address.id,
        }))
      );
    }
  };

  const tabs: { id: Tab; icon: typeof User; label: string }[] = [
    { id: "profile", icon: User, label: t("tabProfile") },
    { id: "addresses", icon: MapPin, label: t("tabAddresses") },
    { id: "orders", icon: Package, label: t("tabOrders") },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  return (
    <div className="page-narrow py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6 tracking-tight">{t("title")}</h1>

      <div className="flex gap-1 mb-6 p-1 bg-bosporus-gray-100 rounded-2xl">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); setMessage(""); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all",
              tab === id ? "bg-white text-bosporus shadow-sm" : "text-bosporus-muted hover:text-bosporus-gray-800"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {message && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-sm text-sm mb-4">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}
      {error && (
        <p className="text-bosporus-red bg-red-50 p-3 rounded-sm text-sm mb-4">{error}</p>
      )}

      {tab === "profile" && (
        <Card>
          <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              value={profile?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm bg-bosporus-gray-50 text-bosporus-muted"
            />
          </div>
          {profile?.company_name && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("company")}</label>
              <input
                value={profile.company_name}
                disabled
                className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm bg-bosporus-gray-50"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("firstName")}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("lastName")}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("phone")}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 ..."
              className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
            />
          </div>
            <Button type="submit" loading={saving} size="lg" fullWidth>{t("save")}</Button>
          </form>
        </Card>
      )}

      {tab === "addresses" && (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id} padding="sm" className="!rounded-2xl">
              <div className="flex justify-between gap-4">
              <div>
                <p className="font-semibold text-bosporus-gray-800 flex items-center gap-2">
                  {addr.label}
                  {addr.is_default && (
                    <span className="text-xs bg-bosporus-light text-bosporus px-2 py-0.5 rounded-sm">
                      {t("default")}
                    </span>
                  )}
                </p>
                <p className="text-sm text-bosporus-muted mt-1">
                  {addr.street}<br />
                  {addr.zip_code} {addr.city}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(addr.id)}
                    className="p-2 text-bosporus hover:bg-bosporus-light rounded-sm"
                    title={t("setDefault")}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteAddress(addr.id)}
                  className="p-2 text-bosporus-red hover:bg-red-50 rounded-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              </div>
            </Card>
          ))}

          {addresses.length === 0 && !showAddressForm && (
            <p className="text-bosporus-muted text-sm text-center py-6">{t("noAddresses")}</p>
          )}

          {showAddressForm ? (
            <form onSubmit={addAddress} className="bg-white p-6 rounded-sm border border-bosporus-gray-200 space-y-3">
              <input
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder={t("addressLabel")}
                className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
              />
              <textarea
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder={t("street")}
                rows={2}
                required
                className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  placeholder={t("zipCode")}
                  required
                  className="px-3 py-2 border border-bosporus-gray-200 rounded-sm"
                />
                <input
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder={t("city")}
                  className="px-3 py-2 border border-bosporus-gray-200 rounded-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                />
                {t("setAsDefault")}
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-bosporus text-white font-semibold rounded-sm">
                  {t("addAddress")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2 border border-bosporus-gray-200 rounded-sm"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="w-full py-3 border-2 border-dashed border-bosporus-gray-200 rounded-sm text-bosporus font-semibold flex items-center justify-center gap-2 hover:border-bosporus hover:bg-bosporus-light"
            >
              <Plus className="w-4 h-4" />
              {t("addAddress")}
            </button>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-bosporus-muted text-sm text-center py-10">{t("noOrders")}</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-sm border border-bosporus-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-4 text-left flex justify-between items-start gap-4 hover:bg-bosporus-gray-50"
                >
                  <div>
                    <p className="font-bold text-bosporus">{order.order_number}</p>
                    <p className="text-xs text-bosporus-muted mt-1">
                      {new Date(order.created_at).toLocaleDateString(locale === "de" ? "de-DE" : "tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm mt-1">
                      {order.order_type === "delivery" ? t("typeDelivery") : t("typePickup")}
                      {" · "}
                      <span className="text-bosporus-muted">
                        {t(STATUS_KEYS[order.status] ?? "statusPending")}
                      </span>
                    </p>
                  </div>
                  <p className="font-bold text-bosporus shrink-0">
                    {formatPrice(order.total_gross, locale)}
                  </p>
                </button>
                {expandedOrder === order.id && (
                  <div className="border-t border-bosporus-gray-100 px-4 py-3 bg-bosporus-gray-50">
                    {order.order_type === "delivery" ? (
                      <p className="text-sm text-bosporus-muted mb-3">
                        {order.delivery_address?.raw ?? ""} · {order.delivery_zip_code}
                      </p>
                    ) : (
                      <p className="text-sm text-bosporus-muted mb-3">
                        {order.pickup_date} · {order.pickup_slot_label}
                      </p>
                    )}
                    <ul className="space-y-1 text-sm">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{item.quantity}× {item.product_name}</span>
                          <span>{formatPrice(item.line_total_gross, locale)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
