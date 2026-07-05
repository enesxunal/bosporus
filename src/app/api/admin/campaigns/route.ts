import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmails } from "@/lib/email/smtp";
import { templatePromotion, type EmailAudience } from "@/lib/email/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data, error } = await admin
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { subject, headline, bodyHtml, audience, sendNow } = body as {
    subject: string;
    headline: string;
    bodyHtml: string;
    audience: EmailAudience;
    sendNow?: boolean;
  };

  if (!subject?.trim() || !headline?.trim() || !bodyHtml?.trim()) {
    return NextResponse.json({ error: "Betreff, Überschrift und Inhalt erforderlich" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .insert({
      subject: subject.trim(),
      headline: headline.trim(),
      html_body: bodyHtml.trim(),
      audience: audience ?? "all",
      created_by: auth.profile.id,
    })
    .select()
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: error?.message ?? "Fehler" }, { status: 500 });
  }

  if (!sendNow) {
    return NextResponse.json({ campaign });
  }

  const result = await sendCampaign(admin, campaign.id, subject, headline, bodyHtml, audience ?? "all");
  return NextResponse.json({ campaign, ...result });
}

async function sendCampaign(
  admin: SupabaseClient,
  campaignId: string,
  subject: string,
  headline: string,
  bodyHtml: string,
  audience: EmailAudience
) {
  let query = admin.from("profiles").select("email, locale, role");

  if (audience === "b2c") query = query.eq("role", "b2c");
  else if (audience === "b2b") query = query.in("role", ["b2b_pending", "b2b_approved"]);
  else if (audience === "b2b_approved") query = query.eq("role", "b2b_approved");

  const { data: recipients } = await query;
  const emails = (recipients ?? []).filter((r) => r.email);

  const { subject: _, html } = templatePromotion({ headline, bodyHtml });

  const bulk = emails.map((r) => ({
    to: r.email,
    subject,
    html,
    templateType: "campaign" as const,
    referenceId: campaignId,
  }));

  const stats = await sendBulkEmails(bulk);

  await admin
    .from("email_campaigns")
    .update({ sent_at: new Date().toISOString(), sent_count: stats.sent })
    .eq("id", campaignId);

  return stats;
}
