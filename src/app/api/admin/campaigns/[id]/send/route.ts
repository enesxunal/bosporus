import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmails } from "@/lib/email/smtp";
import { templatePromotion } from "@/lib/email/templates";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 });
  }

  if (campaign.sent_at) {
    return NextResponse.json({ error: "Bereits gesendet" }, { status: 400 });
  }

  let query = admin.from("profiles").select("email, role");
  const audience = campaign.audience as string;
  if (audience === "b2c") query = query.eq("role", "b2c");
  else if (audience === "b2b") query = query.in("role", ["b2b_pending", "b2b_approved"]);
  else if (audience === "b2b_approved") query = query.eq("role", "b2b_approved");

  const { data: recipients } = await query;
  const { html } = templatePromotion({
    headline: campaign.subject,
    bodyHtml: campaign.html_body,
  });

  const bulk = (recipients ?? [])
    .filter((r) => r.email)
    .map((r) => ({
      to: r.email,
      subject: campaign.subject,
      html,
      templateType: "campaign" as const,
      referenceId: campaign.id,
    }));

  const stats = await sendBulkEmails(bulk);

  await admin
    .from("email_campaigns")
    .update({ sent_at: new Date().toISOString(), sent_count: stats.sent })
    .eq("id", id);

  return NextResponse.json(stats);
}
