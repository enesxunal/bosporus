import type { SupabaseClient } from "@supabase/supabase-js";
import type { AcquisitionMedium, AcquisitionSource, ClickIdType } from "./acquisition";

interface AcquisitionClaim {
  source: AcquisitionSource;
  medium: AcquisitionMedium;
  campaign: string | null;
  clickIdType: ClickIdType | null;
  firstSeenAt: string;
}

export async function claimUserAcquisition({
  userId,
  claim,
  admin,
}: {
  userId: string;
  claim: AcquisitionClaim;
  admin: SupabaseClient;
}) {
  const { error } = await admin.from("user_acquisition").insert({
    user_id: userId,
    source: claim.source,
    medium: claim.medium,
    campaign: claim.campaign,
    click_id_type: claim.clickIdType,
    first_seen_at: claim.firstSeenAt,
  });

  if (!error) return { ok: true as const, claimed: true as const };
  if (error.code === "23505") {
    return { ok: true as const, claimed: false as const, existing: true as const };
  }
  return { ok: false as const, error: error.message };
}
