import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/login", locale);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
