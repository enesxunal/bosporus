"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Loader2, XCircle } from "lucide-react";

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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "b2b_approved") {
        router.push("/gewerbe");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-6">{t("loginTitle")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-sm border border-bosporus-gray-200">
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-bosporus/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-bosporus-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-bosporus/30"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-bosporus-red bg-red-50 p-3 rounded-sm text-sm">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-bosporus text-white font-semibold rounded-sm hover:bg-bosporus-dark disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("loginSubmit")}
        </button>
      </form>
      <p className="text-center text-sm text-bosporus-muted mt-6">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-bosporus font-semibold hover:underline">
          {t("registerLink")}
        </Link>
      </p>
      <p className="text-center text-sm mt-3">
        <Link href="/register?tab=gewerbe" className="text-metro-navy font-semibold hover:underline">
          {t("businessRegisterLink")}
        </Link>
      </p>
    </div>
  );
}
