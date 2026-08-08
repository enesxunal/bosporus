import { NextResponse } from "next/server";
import {
  assertNoB2cPublicLeak,
  checkPublicB2bDelivery,
  isValidGermanPlz,
  normalizeGermanPlz,
} from "@/lib/delivery-check";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Public B2B delivery PLZ check.
 * Never uses guest b2c_delivery (100/250). Geocoding stays server-side.
 */
export async function GET(request: Request) {
  const limited = rateLimit(`delivery-check:${clientIp(request)}`, 40, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const zipCode = normalizeGermanPlz(
    new URL(request.url).searchParams.get("zipCode") ?? ""
  );

  if (!isValidGermanPlz(zipCode)) {
    return NextResponse.json({ error: "INVALID_PLZ" }, { status: 400 });
  }

  try {
    const result = await checkPublicB2bDelivery(zipCode);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!assertNoB2cPublicLeak(result.check)) {
      console.error("delivery-check: blocked B2C leak");
      return NextResponse.json({ error: "CHECK_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ...result.check,
    });
  } catch (e) {
    console.error("delivery-check:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "CHECK_FAILED" }, { status: 500 });
  }
}
