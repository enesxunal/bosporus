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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search")}
        className="w-full pl-10 pr-4 py-2.5 border-2 border-bosporus-gray-200 rounded-sm text-sm focus:outline-none focus:border-bosporus bg-white"
      />
    </form>
  );
}
