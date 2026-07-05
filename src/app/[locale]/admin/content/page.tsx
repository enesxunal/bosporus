"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface GapProduct {
  id: string;
  sku: string;
  name_de: string;
  name_tr: string | null;
  missing: string[];
  missingCount: number;
}

const GAP_KEYS: Record<string, string> = {
  name_tr: "gapNameTr",
  description_de: "gapDescDe",
  description_tr: "gapDescTr",
  image: "gapImage",
};

export default function AdminContentPage() {
  const t = useTranslations("adminContent");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<GapProduct[]>([]);

  useEffect(() => {
    fetch("/api/admin/products/content-gaps")
      .then((r) => r.json())
      .then((d) => {
        setTotal(d.total ?? 0);
        setProducts(d.products ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-bosporus" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-metro-navy mb-2">{t("title")}</h1>
      <p className="text-sm text-bosporus-muted mb-6">{t("desc")}</p>

      {products.length === 0 ? (
        <Card className="!rounded-2xl flex items-center gap-3 text-green-700 bg-green-50">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {t("complete")}
        </Card>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-700 bg-orange-50 px-4 py-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4" />
            {t("missing", { count: products.length })} / {total}
          </p>
          <div className="space-y-2">
            {products.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`}>
                <Card padding="sm" className="!rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-bosporus truncate">{p.name_de}</p>
                      <p className="text-xs text-bosporus-muted font-mono">{p.sku}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.missing.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800"
                          >
                            {t(GAP_KEYS[g] ?? g)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-sm font-semibold text-bosporus">
                      {t("edit")}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
