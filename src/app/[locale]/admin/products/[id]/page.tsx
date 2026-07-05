"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin/AdminProductForm";

export default function AdminProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("admin");

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-bosporus-muted hover:text-bosporus mb-4">
        <ArrowLeft className="w-4 h-4" /> {t("backToProducts")}
      </Link>
      <AdminProductForm productId={id} />
    </div>
  );
}
