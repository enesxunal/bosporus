"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { useTranslations } from "next-intl";

export default function AdminNewProductPage() {
  const t = useTranslations("admin");

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-4">
        <ArrowLeft className="w-4 h-4" /> {t("backToProducts")}
      </Link>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-4">{t("newProduct")}</h1>
      <AdminProductForm />
    </div>
  );
}
