"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(t("verifyResent"));
      } else if (res.status === 429) {
        setErr(locale === "tr" ? "Lütfen bir dakika bekleyin." : "Bitte warten Sie eine Minute.");
      } else {
        setErr(data.error ?? t("connectionError"));
      }
    } catch {
      setErr(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold text-bosporus-gray-800 mb-6">{t("verifyTitle")}</h1>
      <Card className="space-y-4">
        <p className="text-bosporus-muted">{t("verifyDesc")}</p>
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <Button onClick={resend} disabled={loading || !email.trim()}>
          {loading ? "…" : t("verifyResend")}
        </Button>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <p className="text-sm">
          <Link href="/login" className="text-bosporus font-bold hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
