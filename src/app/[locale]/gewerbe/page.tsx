import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

/** Eski B2B portal → artık ana ürün kataloğu (liste + kart) */
export default async function GewerbeRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/products", locale });
}
