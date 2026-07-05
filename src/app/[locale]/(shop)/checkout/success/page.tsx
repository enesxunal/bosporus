import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const t = await getTranslations("cart");
  const c = await getTranslations("checkout");

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-2">
        {c("successTitle")}
      </h1>
      {order && (
        <p className="text-lg font-mono font-bold text-bosporus mb-2">{order}</p>
      )}
      <p className="text-bosporus-muted mb-6">{c("successDesc")}</p>
      <Link href="/products" className="text-bosporus font-medium hover:underline">
        {t("continue")} →
      </Link>
    </div>
  );
}
