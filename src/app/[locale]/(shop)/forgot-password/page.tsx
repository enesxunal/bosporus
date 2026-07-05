"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError(t("dbError"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=${locale === "tr" ? "/tr/reset-password" : "/reset-password"}`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6">{t("forgotTitle")}</h1>
      <Card>
        {sent ? (
          <p className="text-green-700">{t("forgotSent")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-bosporus-muted">{t("forgotDesc")}</p>
            <Input label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="text-bosporus-red text-sm">{error}</p>}
            <Button type="submit" loading={loading} size="lg" fullWidth>{t("forgotSubmit")}</Button>
          </form>
        )}
      </Card>
      <p className="text-center text-sm mt-6">
        <Link href="/login" className="text-bosporus font-bold hover:underline">{t("loginLink")}</Link>
      </p>
    </div>
  );
}
