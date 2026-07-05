import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle, ArrowRight, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const t = await getTranslations("cart");
  const c = await getTranslations("checkout");
  const track = await getTranslations("orderTrack");

  return (
    <div className="page-narrow py-16 sm:py-24 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-bosporus-gray-800 mb-3 tracking-tight">
        {c("successTitle")}
      </h1>
      {order && (
        <Card padding="sm" className="inline-block !rounded-xl mb-4">
          <p className="text-lg font-mono font-bold text-bosporus">{order}</p>
        </Card>
      )}
      <p className="text-bosporus-muted mb-6 max-w-sm mx-auto">{c("successDesc")}</p>
      {order && (
        <Link
          href={`/order/track?order=${encodeURIComponent(order)}`}
          className="inline-flex items-center gap-2 text-bosporus font-bold hover:underline mb-6"
        >
          <Search className="w-4 h-4" />
          {track("title")}
        </Link>
      )}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-bosporus-muted font-semibold hover:text-bosporus"
        >
          {t("continue")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
