"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { User, Building2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
        const err = data.error;
        setMessage(
          typeof err === "string" ? err : err?.message ?? "Fehler"
        );
        return;
      }
      setStatus("success");
      setMessage(data.message);
      if (data.needsVerification) {
        setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(b2cForm.email)}`), 1500);
      } else {
        setTimeout(() => router.push("/login"), 2000);
      }
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
        const err = data.error;
        setMessage(
          typeof err === "string" ? err : err?.message ?? "Fehler"
        );
        return;
      }
      setStatus("success");
      setMessage(data.message);
      if (data.needsVerification) {
        setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(b2bForm.email)}`), 1500);
      } else {
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setStatus("error");
      setMessage("Verbindungsfehler");
    }
  };

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6 tracking-tight">{t("registerTitle")}</h1>

      <div className="flex mb-6 p-1 bg-bosporus-gray-100 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => { setTab("b2c"); setStatus("idle"); setMessage(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all",
            tab === "b2c" ? "bg-white text-bosporus shadow-sm" : "text-bosporus-muted hover:text-bosporus-gray-800"
          )}
        >
          <User className="w-4 h-4" />
          {t("tabPrivate")}
        </button>
        <button
          type="button"
          onClick={() => { setTab("b2b"); setStatus("idle"); setMessage(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all",
            tab === "b2b" ? "bg-metro-navy text-white shadow-sm" : "text-bosporus-muted hover:text-bosporus-gray-800"
          )}
        >
          <Building2 className="w-4 h-4" />
          {t("tabBusiness")}
        </button>
      </div>

      {tab === "b2c" ? (
        <Card>
          <form onSubmit={handleB2cSubmit} className="space-y-4">
            <p className="text-sm text-bosporus-muted">{t("privateHint")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("firstName")} value={b2cForm.firstName} onChange={(e) => setB2cForm({ ...b2cForm, firstName: e.target.value })} />
              <Input label={t("lastName")} value={b2cForm.lastName} onChange={(e) => setB2cForm({ ...b2cForm, lastName: e.target.value })} />
            </div>
            <Input label="E-Mail" type="email" value={b2cForm.email} onChange={(e) => setB2cForm({ ...b2cForm, email: e.target.value })} required />
            <Input label={t("password")} type="password" value={b2cForm.password} onChange={(e) => setB2cForm({ ...b2cForm, password: e.target.value })} required />
            <Button type="submit" loading={status === "loading"} size="lg" fullWidth>{t("registerSubmit")}</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleB2bSubmit} className="space-y-4">
            <p className="text-sm text-bosporus-muted">{t("businessHint")}</p>
            <Input label={tb("companyName")} value={b2bForm.companyName} onChange={(e) => setB2bForm({ ...b2bForm, companyName: e.target.value })} required />
            <Textarea label={tb("companyAddress")} value={b2bForm.companyAddress} onChange={(e) => setB2bForm({ ...b2bForm, companyAddress: e.target.value })} rows={2} required />
            <div>
              <Input label={tb("vatId")} value={b2bForm.vatId} onChange={(e) => setB2bForm({ ...b2bForm, vatId: e.target.value.toUpperCase() })} required placeholder="DE123456789" />
              <p className="text-xs text-bosporus-muted mt-1">{tb("vatHint")}</p>
            </div>
            <Input label="E-Mail" type="email" value={b2bForm.email} onChange={(e) => setB2bForm({ ...b2bForm, email: e.target.value })} required />
            <Input label={t("password")} type="password" value={b2bForm.password} onChange={(e) => setB2bForm({ ...b2bForm, password: e.target.value })} required />
            <Button type="submit" loading={status === "loading"} size="lg" fullWidth>{tb("registerSubmit")}</Button>
          </form>
        </Card>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-xl text-sm mt-4 border border-green-100">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-bosporus-red bg-red-50 p-4 rounded-xl text-sm mt-4 border border-red-100">
          <XCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      <p className="text-center text-sm text-bosporus-muted mt-6">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-bosporus font-semibold hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-bosporus-muted">…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
