"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("passwordMin"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!isSupabaseConfigured()) {
      setError(t("dbError"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6">{t("resetTitle")}</h1>
      <Card>
        {done ? (
          <p className="text-green-700">{t("resetSuccess")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("newPassword")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label={t("confirmPassword")} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-bosporus-red text-sm">{error}</p>}
            <Button type="submit" loading={loading} size="lg" fullWidth>{t("resetSubmit")}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
