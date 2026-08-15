"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Building2, CheckCircle, XCircle, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { trackGenerateLead } from "@/lib/analytics";
import {
  trackB2bApplicationSubmitted,
  trackRegistrationCompleted,
  trackRegistrationStarted,
  trackRegisterView,
} from "@/lib/site-funnel-client";

function RegisterForm() {
  const t = useTranslations("auth");
  const tb = useTranslations("b2b");
  const ts = useTranslations("registerSuccess");
  const locale = useLocale() as "de" | "tr";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    trackRegisterView(locale);
  }, [locale]);

  const [b2bForm, setB2bForm] = useState({
    companyName: "",
    companyAddress: "",
    contactPerson: "",
    vatId: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleB2bSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // İstemci doğrulaması (backend zaten tekrar doğrular)
    if (b2bForm.contactPerson.trim().length < 2) {
      setStatus("error");
      setMessage(tb("contactPersonInvalid"));
      return;
    }
    const phoneDigits = b2bForm.phone.replace(/\D/g, "");
    if (/[A-Za-zÀ-ÿ]/.test(b2bForm.phone) || phoneDigits.length < 7) {
      setStatus("error");
      setMessage(tb("phoneInvalid"));
      return;
    }

    setStatus("loading");
    trackRegistrationStarted(locale);
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
        const raw = typeof err === "string" ? err : err?.message ?? "";
        // Ham teknik hataları kullanıcıya gösterme
        const technical = /supabase|smtp|mx|vies|pgrst|fetch|network|undefined|null|stack/i.test(raw);
        setMessage(raw && !technical ? raw : t("connectionError"));
        return;
      }
      setStatus("success");
      setMessage(data.message ?? "");
      trackGenerateLead("b2b_register");
      trackRegistrationCompleted(locale);
      trackB2bApplicationSubmitted(locale);
    } catch {
      setStatus("error");
      setMessage(t("connectionError"));
    }
  };

  if (status === "success") {
    return (
      <div className="page-narrow py-10 sm:py-14">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-7 h-7 text-green-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-bosporus-gray-800">{ts("title")}</h1>
          </div>
          <p className="text-sm text-bosporus-muted leading-relaxed mb-4">{ts("text")}</p>
          <ol className="space-y-2 mb-4">
            {[ts("step1"), ts("step2"), ts("step3")].map((step, i) => (
              <li key={step} className="flex gap-3 items-start text-sm text-bosporus-gray-800">
                <span className="shrink-0 w-6 h-6 rounded-lg bg-bosporus text-white font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-bosporus-muted mb-5">{ts("note")}</p>
          <Link href={`/verify-email?email=${encodeURIComponent(b2bForm.email)}`}>
            <Button size="lg" fullWidth>
              <Mail className="w-4 h-4" />
              {ts("verifyCta")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

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
          <Input
            label={tb("contactPerson")}
            value={b2bForm.contactPerson}
            onChange={(e) => setB2bForm({ ...b2bForm, contactPerson: e.target.value })}
            placeholder={tb("contactPersonPlaceholder")}
            autoComplete="name"
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
            label={tb("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={b2bForm.phone}
            onChange={(e) => setB2bForm({ ...b2bForm, phone: e.target.value })}
            placeholder={tb("phonePlaceholder")}
            required
          />
          <Input
            label="E-Mail"
            type="email"
            autoComplete="email"
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
