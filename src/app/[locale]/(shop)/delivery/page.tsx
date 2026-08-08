"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Truck } from "lucide-react";
import { DeliveryPlzChecker } from "@/components/b2c/DeliveryPlzChecker";
import { COMPANY } from "@/lib/company";

export default function DeliveryPage() {
  const t = useTranslations("deliveryCheck");

  return (
    <div className="page-container py-8 sm:py-12 pb-28 md:pb-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-bosporus-light flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-bosporus" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-bosporus-muted mt-1 leading-relaxed">{t("subtitle")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-bosporus-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <DeliveryPlzChecker />
        </div>

        <p className="text-xs text-bosporus-muted mt-4 leading-relaxed">
          {t("b2bNote", { city: COMPANY.city })}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/register" className="text-bosporus hover:underline">
            {t("ctaRegister")}
          </Link>
          <Link href="/products" className="text-bosporus-muted hover:underline">
            {t("ctaProducts")}
          </Link>
        </div>
      </div>
    </div>
  );
}
