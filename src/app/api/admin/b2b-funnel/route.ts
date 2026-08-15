import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getB2bFunnelSummary } from "@/lib/b2b-funnel-admin";

const WINDOWS = [7, 30, 90] as const;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const windows: Record<string, Awaited<ReturnType<typeof getB2bFunnelSummary>>> = {};

  for (const days of WINDOWS) {
    const summary = await getB2bFunnelSummary(days);
    if (!summary.ok) {
      return NextResponse.json({ error: summary.error }, { status: 503 });
    }
    windows[String(days)] = summary;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    windows: {
      "7": windows["7"],
      "30": windows["30"],
      "90": windows["90"],
    },
  });
}
