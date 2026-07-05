"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Building2, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function B2BRegisterPage() {
  const t = useTranslations("b2b");
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    companyAddress: "",
    vatId: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/b2b-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Fehler");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      setTimeout(() => router.push("/gewerbe"), 2000);
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-6 h-6 text-bosporus" />
        <h1 className="text-2xl font-bold text-bosporus-gray-800">{t("registerTitle")}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-bosporus-gray-200">
        <Field label={t("companyName")} value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
        <Field label={t("companyAddress")} value={form.companyAddress} onChange={(v) => setForm({ ...form, companyAddress: v })} required />
        <div>
          <Field label={t("vatId")} value={form.vatId} onChange={(v) => setForm({ ...form, vatId: v.toUpperCase() })} required placeholder="DE123456789" />
          <p className="text-xs text-bosporus-muted mt-1">{t("vatHint")}</p>
        </div>
        <Field label="E-Mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Passwort" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-bosporus-red bg-red-50 p-3 rounded-lg text-sm">
            <XCircle className="w-4 h-4" />
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3 bg-bosporus text-white font-semibold rounded-lg hover:bg-bosporus-dark disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("registerSubmit")}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-bosporus-gray-800 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bosporus/30"
      />
    </div>
  );
}
