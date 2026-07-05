"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";

export function ProductSearch({ initialQuery }: { initialQuery?: string }) {
  const t = useTranslations("product");
  const router = useRouter();
  const [q, setQ] = useState(initialQuery ?? "");

  useEffect(() => {
    setQ(initialQuery ?? "");
  }, [initialQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search")}
        className="field-input !pl-11"
      />
    </form>
  );
}
