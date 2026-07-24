"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured()) {
      setError("Datenbank nicht verbunden. Bitte später erneut versuchen.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      await supabase.auth.getSession();
      router.refresh();

      if (profile?.role === "b2b_approved" || profile?.role === "b2b_pending") {
        router.push("/products");
      } else if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/products");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-6 tracking-tight">{t("loginTitle")}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && (
            <div className="flex items-center gap-2 text-bosporus-red bg-red-50 p-3 rounded-xl text-sm">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} size="lg" fullWidth>
            {t("loginSubmit")}
          </Button>
        </form>
      </Card>
      <p className="text-center text-sm text-bosporus-muted mt-6">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-bosporus font-bold hover:underline">{t("registerLink")}</Link>
      </p>
      <p className="text-center text-sm mt-3">
        <Link href="/forgot-password" className="text-bosporus-muted hover:text-bosporus font-semibold">
          {t("forgotLink")}
        </Link>
      </p>
      <p className="text-center text-sm mt-3">
        <Link href="/register" className="text-metro-navy font-bold hover:underline">
          {t("businessRegisterLink")}
        </Link>
      </p>
    </div>
  );
}
