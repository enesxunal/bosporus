import { redirect } from "@/i18n/navigation";

export default async function GewerbeRegisterRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/register?tab=gewerbe", locale });
}
