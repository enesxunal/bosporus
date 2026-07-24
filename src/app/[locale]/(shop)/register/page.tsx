"use client";

import { useState, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Building2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { trackSignUp } from "@/lib/analytics";

function RegisterForm() {
  const t = useTranslations("auth");
  const tb = useTranslations("b2b");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [b2bForm, setB2bForm] = useState({
    companyName: "",
    companyAddress: "",
    vatId: "",
    email: "",
    password: "",
  });

  const handleB2bSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/b2b-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b2bForm, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        const err = data.error;
        setMessage(typeof err === "string" ? err : err?.message ?? "Fehler");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      trackSignUp("b2b");
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
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-8 h-8 text-bosporus" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight">
          {tb("registerTitle")}
        </h1>
      </div>
      <p className="text-sm text-bosporus-muted mb-6">
        {locale === "tr"
          ? "Toptancı / gastronomi kaydı. Onay sonrası net fiyatlar ve sipariş açılır. Min. 500 € · ilk siparişte getirme ücretsiz."
          : "Gewerbe- / Gastronomie-Registrierung. Nach Freigabe: Nettopreise & Bestellung. Min. 500 € · erste Lieferung gratis."}
      </p>

      <Card>
        <form onSubmit={handleB2bSubmit} className="space-y-4">
          <p className="text-sm text-bosporus-muted">{t("businessHint")}</p>
          <Input
            label={tb("companyName")}
            value={b2bForm.companyName}
            onChange={(e) => setB2bForm({ ...b2bForm, companyName: e.target.value })}
            required
          />
          <Textarea
            label={tb("companyAddress")}
            value={b2bForm.companyAddress}
            onChange={(e) => setB2bForm({ ...b2bForm, companyAddress: e.target.value })}
            rows={2}
            required
          />
          <div>
            <Input
              label={tb("vatId")}
              value={b2bForm.vatId}
              onChange={(e) => setB2bForm({ ...b2bForm, vatId: e.target.value.toUpperCase() })}
              required
              placeholder="DE123456789"
            />
            <p className="text-xs text-bosporus-muted mt-1">{tb("vatHint")}</p>
          </div>
          <Input
            label="E-Mail"
            type="email"
            value={b2bForm.email}
            onChange={(e) => setB2bForm({ ...b2bForm, email: e.target.value })}
            required
          />
          <Input
            label={t("password")}
            type="password"
            value={b2bForm.password}
            onChange={(e) => setB2bForm({ ...b2bForm, password: e.target.value })}
            required
          />
          <Button type="submit" loading={status === "loading"} size="lg" fullWidth>
            {tb("registerSubmit")}
          </Button>
        </form>
      </Card>

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
