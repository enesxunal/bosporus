import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { recordFirstLoginAfterApproval } from "@/lib/b2b-funnel-server";

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const result = await recordFirstLoginAfterApproval(auth.user.id);
  return NextResponse.json({
    ok: result.ok,
    recorded: result.recorded === true,
  });
}
