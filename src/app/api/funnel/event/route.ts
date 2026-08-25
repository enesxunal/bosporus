import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isVerifiedBotUserAgent, userAgentFromRequest } from "@/lib/bot-detection";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseSiteEvent } from "@/lib/site-funnel-request";
import { recordSiteFunnelEvent } from "@/lib/site-funnel-server";

const MAX_BODY_BYTES = 2_048;

export async function POST(request: Request) {
  // Analytics only: verified crawlers must not write site_funnel_events.
  // Product pages remain crawlable — this endpoint never gates page access.
  if (isVerifiedBotUserAgent(userAgentFromRequest(request))) {
    return NextResponse.json({ ok: true, recorded: false, excluded: "bot" });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const payload = parseSiteEvent(raw);
  if (!payload) {
    return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
  }

  // Rate-limit per first-party visitor, with an IP fallback for abuse control.
  const rateKey = payload.anonymousId || clientIp(request);
  const limited = rateLimit(`site-funnel:${rateKey}`, 240, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  // Identity is resolved from the session only; any client user_id is ignored.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const result = await recordSiteFunnelEvent({ payload, userId });
  return NextResponse.json({
    ok: result.ok,
    recorded: result.ok && !result.duplicate,
  });
}
