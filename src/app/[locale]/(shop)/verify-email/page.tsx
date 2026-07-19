import type { Metadata } from "next";
import { shopPageMetadata } from "@/lib/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return shopPageMetadata("/verify-email", locale);
}

import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-bosporus-muted">…</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
