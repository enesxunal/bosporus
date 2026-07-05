import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { templatePromotion } from "@/lib/email/templates";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { headline, bodyHtml, locale } = (await request.json()) as {
    headline?: string;
    bodyHtml?: string;
    locale?: "de" | "tr";
  };

  if (!headline?.trim()) {
    return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });
  }

  const { html } = templatePromotion({
    locale: locale === "tr" ? "tr" : "de",
    headline: headline.trim(),
    bodyHtml: (bodyHtml ?? "").replace(/\n/g, "<br>"),
  });

  return NextResponse.json({ html });
}
