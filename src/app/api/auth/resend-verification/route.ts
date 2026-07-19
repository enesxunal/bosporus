import { NextResponse } from "next/server";
import { sendAccountVerificationEmail } from "@/lib/auth-verification-email";

export async function POST(request: Request) {
  const { email, locale } = (await request.json()) as {
    email?: string;
    locale?: "de" | "tr";
  };
  if (!email?.trim()) {
    return NextResponse.json({ error: "E-Mail erforderlich" }, { status: 400 });
  }

  const result = await sendAccountVerificationEmail({
    email,
    locale: locale ?? "de",
    variant: "b2c",
    isResend: true,
  });

  if (!result.ok) {
    const status = result.code === "RATE_LIMIT" ? 429 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ success: true });
}
