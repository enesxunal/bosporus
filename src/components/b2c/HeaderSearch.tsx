"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

export function HeaderSearch() {
  const t = useTranslations("product");
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/products?q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search")}
        className="w-full pl-4 pr-12 py-2.5 border-2 border-bosporus-gray-200 rounded-sm text-sm focus:outline-none focus:border-bosporus bg-bosporus-gray-50"
      />
      <button
        type="submit"
        className="absolute right-0 top-0 h-full px-4 bg-bosporus text-white rounded-r-sm hover:bg-bosporus-dark transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
