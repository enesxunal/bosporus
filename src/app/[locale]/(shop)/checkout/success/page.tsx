import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const t = await getTranslations("cart");

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-2">
        Bestellung erfolgreich!
      </h1>
      <p className="text-bosporus-muted mb-2">
        Vielen Dank für Ihre Bestellung bei Bosporus GmbH.
      </p>
      {demo === "1" && (
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4">
          Demo-Modus: Stripe noch nicht konfiguriert. Bestellung simuliert.
        </p>
      )}
      <Link href="/products" className="text-bosporus font-medium hover:underline">
        {t("continue")} →
      </Link>
    </div>
  );
}
