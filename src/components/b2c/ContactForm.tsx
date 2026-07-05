"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, message, locale }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? t("error"));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="!rounded-2xl">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p>{t("success")}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!rounded-2xl">
      <h2 className="font-bold text-lg mb-4">{t("formTitle")}</h2>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t("phone")} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Textarea label={t("message")} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required />
        {error && <p className="text-bosporus-red text-sm">{error}</p>}
        <Button type="submit" loading={loading} size="lg">{t("submit")}</Button>
      </form>
    </Card>
  );
}
