import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { FUNNEL_WINDOWS, isFunnelDays } from "@/lib/funnel-period";
import { getSiteFunnelSummary } from "@/lib/site-funnel-admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const daysParam = request.nextUrl.searchParams.get("days");
  const requestedDays = daysParam === null ? null : Number(daysParam);

  if (requestedDays !== null && !isFunnelDays(requestedDays)) {
    return NextResponse.json({ error: "INVALID_DATE_RANGE" }, { status: 400 });
  }

  const selectedWindows =
    requestedDays === null ? FUNNEL_WINDOWS : ([requestedDays] as const);
  const windows: Record<string, Awaited<ReturnType<typeof getSiteFunnelSummary>>> = {};

  for (const days of selectedWindows) {
    const summary = await getSiteFunnelSummary(days);
    if (!summary.ok) {
      return NextResponse.json({ error: summary.error }, { status: 503 });
    }
    windows[String(days)] = summary;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    windows,
  });
}
