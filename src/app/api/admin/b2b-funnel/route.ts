import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getB2bFunnelSummary } from "@/lib/b2b-funnel-admin";

const WINDOWS = [7, 30, 90] as const;
type WindowDays = (typeof WINDOWS)[number];

function isWindowDays(value: number): value is WindowDays {
  return WINDOWS.includes(value as WindowDays);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const daysParam = request.nextUrl.searchParams.get("days");
  const requestedDays = daysParam === null ? null : Number(daysParam);

  if (requestedDays !== null && !isWindowDays(requestedDays)) {
    return NextResponse.json({ error: "INVALID_DATE_RANGE" }, { status: 400 });
  }

  const selectedWindows: readonly WindowDays[] =
    requestedDays === null ? WINDOWS : [requestedDays];
  const windows: Record<string, Awaited<ReturnType<typeof getB2bFunnelSummary>>> = {};

  for (const days of selectedWindows) {
    const summary = await getB2bFunnelSummary(days);
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
