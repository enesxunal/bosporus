import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { isFirstPartyId } from "@/lib/site-funnel-shared";
import { linkVisitorIdentity } from "@/lib/site-funnel-server";

/**
 * Links a first-party anonymous journey to the authenticated user.
 * The user_id is taken from the session — never from the request body — so a
 * client can only ever link an anonymous id to its own account.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limited = rateLimit(`funnel-identity:${auth.user.id}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  let anonymousId: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    anonymousId = body.anonymousId;
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (!isFirstPartyId(anonymousId)) {
    return NextResponse.json({ error: "INVALID_ANONYMOUS_ID" }, { status: 400 });
  }

  const result = await linkVisitorIdentity({ anonymousId, userId: auth.user.id });
  return NextResponse.json({ ok: result.ok });
}
