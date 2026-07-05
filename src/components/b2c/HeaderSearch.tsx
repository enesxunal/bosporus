"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { cn } from "@/lib/cn";

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
        className="field-input !pr-14 !rounded-2xl !bg-bosporus-gray-50 !border-bosporus-gray-200"
      />
      <button
        type="submit"
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2",
          "h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center",
          "bg-bosporus text-white rounded-xl",
          "hover:bg-bosporus-dark active:scale-95 transition-all",
          "shadow-[var(--shadow-btn)]"
        )}
        aria-label={t("search")}
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
