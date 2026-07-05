"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { User, Building2, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Tab = "b2c" | "b2b";

function RegisterForm() {
  const t = useTranslations("auth");
  const tb = useTranslations("b2b");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "gewerbe" ? "b2b" : "b2c";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [b2cForm, setB2cForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [b2bForm, setB2bForm] = useState({
    companyName: "",
    companyAddress: "",
    vatId: "",
    email: "",
    password: "",
  });

  const handleB2cSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b2cForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Fehler");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
    }
  };

  const handleB2bSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/b2b-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b2bForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Fehler");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-6">{t("registerTitle")}</h1>

      {/* Tab switcher */}
      <div className="flex mb-6 border border-bosporus-gray-200 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => { setTab("b2c"); setStatus("idle"); setMessage(""); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === "b2c"
              ? "bg-bosporus text-white"
              : "bg-white text-bosporus-gray-800 hover:bg-bosporus-light"
          }`}
        >
          <User className="w-4 h-4" />
          {t("tabPrivate")}
        </button>
        <button
          type="button"
          onClick={() => { setTab("b2b"); setStatus("idle"); setMessage(""); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tab === "b2b"
              ? "bg-metro-navy text-white"
              : "bg-white text-bosporus-gray-800 hover:bg-bosporus-light"
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t("tabBusiness")}
        </button>
      </div>

      {tab === "b2c" ? (
        <form onSubmit={handleB2cSubmit} className="space-y-4 bg-white p-6 rounded-sm border border-bosporus-gray-200">
          <p className="text-sm text-bosporus-muted">{t("privateHint")}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("firstName")} value={b2cForm.firstName} onChange={(v) => setB2cForm({ ...b2cForm, firstName: v })} />
            <Field label={t("lastName")} value={b2cForm.lastName} onChange={(v) => setB2cForm({ ...b2cForm, lastName: v })} />
          </div>
          <Field label="E-Mail" type="email" value={b2cForm.email} onChange={(v) => setB2cForm({ ...b2cForm, email: v })} required />
          <Field label={t("password")} type="password" value={b2cForm.password} onChange={(v) => setB2cForm({ ...b2cForm, password: v })} required />
          <SubmitButton status={status} label={t("registerSubmit")} />
        </form>
      ) : (
        <form onSubmit={handleB2bSubmit} className="space-y-4 bg-white p-6 rounded-sm border border-bosporus-gray-200">
          <p className="text-sm text-bosporus-muted">{t("businessHint")}</p>
          <Field label={tb("companyName")} value={b2bForm.companyName} onChange={(v) => setB2bForm({ ...b2bForm, companyName: v })} required />
          <Field label={tb("companyAddress")} value={b2bForm.companyAddress} onChange={(v) => setB2bForm({ ...b2bForm, companyAddress: v })} required />
          <div>
            <Field label={tb("vatId")} value={b2bForm.vatId} onChange={(v) => setB2bForm({ ...b2bForm, vatId: v.toUpperCase() })} required placeholder="DE123456789" />
            <p className="text-xs text-bosporus-muted mt-1">{tb("vatHint")}</p>
          </div>
          <Field label="E-Mail" type="email" value={b2bForm.email} onChange={(v) => setB2bForm({ ...b2bForm, email: v })} required />
          <Field label={t("password")} type="password" value={b2bForm.password} onChange={(v) => setB2bForm({ ...b2bForm, password: v })} required />
          <SubmitButton status={status} label={tb("registerSubmit")} />
        </form>
      )}

      <StatusMessage status={status} message={message} />

      <p className="text-center text-sm text-bosporus-muted mt-6">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-bosporus font-semibold hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

function SubmitButton({ status, label }: { status: string; label: string }) {
  return (
    <button
      type="submit"
      disabled={status === "loading"}
      className="w-full py-3 bg-bosporus text-white font-semibold rounded-sm hover:bg-bosporus-dark disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function StatusMessage({ status, message }: { status: string; message: string }) {
  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-sm text-sm mt-4">
        <CheckCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-bosporus-red bg-red-50 p-3 rounded-sm text-sm mt-4">
        <XCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    );
  }
  return null;
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
        className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-bosporus/30"
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-bosporus-muted">Laden…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
