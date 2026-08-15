import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { isClaimWithinSignupWindow, parseAcquisitionClaim } from "@/lib/acquisition";
import { claimUserAcquisition } from "@/lib/acquisition-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const claim = parseAcquisitionClaim(body);
  if (!claim) {
    return NextResponse.json({ error: "INVALID_ACQUISITION_PAYLOAD" }, { status: 400 });
  }

  if (!isClaimWithinSignupWindow(claim.firstSeenAt, auth.user.created_at)) {
    return NextResponse.json({
      ok: true,
      claimed: false,
      reason: "OUTSIDE_SIGNUP_WINDOW",
    });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "ACQUISITION_NOT_CONFIGURED" }, { status: 503 });
  }

  const result = await claimUserAcquisition({
    userId: auth.user.id,
    claim,
    admin,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "ACQUISITION_CLAIM_FAILED" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    claimed: result.claimed,
  });
}
