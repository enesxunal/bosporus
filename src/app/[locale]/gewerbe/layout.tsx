import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";
import { AuthProvider } from "@/contexts/AuthContext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/gewerbe", locale);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
