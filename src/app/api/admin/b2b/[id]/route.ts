import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendB2bStatusEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { action } = (await request.json()) as { action: "approve" | "reject" };

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: before } = await admin
    .from("profiles")
    .select("email, company_name, locale, role, phone")
    .eq("id", id)
    .single();

  if (!before) return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });

  let recipientEmail = (before.email ?? "").trim().toLowerCase();
  if (!recipientEmail) {
    const { data: authUser } = await admin.auth.admin.getUserById(id);
    recipientEmail = (authUser.user?.email ?? "").trim().toLowerCase();
  }

  const companyName = before.company_name ?? "Ihr Unternehmen";
  const locale: "de" | "tr" = before.locale === "tr" ? "tr" : "de";
  const phone = (before.phone as string | null)?.trim() || null;

  if (action === "approve") {
    const { data, error } = await admin
      .from("profiles")
      .update({ role: "b2b_approved", vat_verified: true })
      .eq("id", id)
      .eq("role", "b2b_pending")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let emailSent = false;
    if (recipientEmail) {
      try {
        const result = await sendB2bStatusEmail({
          to: recipientEmail,
          action: "approve",
          companyName,
          locale,
        });
        emailSent = result.ok === true;
      } catch (e) {
        console.error("B2B approve email:", e);
      }
    }

    void import("@/lib/whatsapp")
      .then(({ sendWhatsAppToAdmins, sendWhatsAppCustomerNotify, getB2bApprovedTemplateName }) =>
        import("@/lib/whatsapp-messages").then(
          async ({
            whatsappAdminB2bApproved,
            whatsappCustomerB2bApproved,
            whatsappB2bApprovedTemplateParams,
          }) => {
            await sendWhatsAppToAdmins(
              whatsappAdminB2bApproved({ companyName, email: recipientEmail || "—" })
            );
            if (phone) {
              await sendWhatsAppCustomerNotify({
                to: phone,
                locale,
                fallbackText: whatsappCustomerB2bApproved({ companyName, locale }),
                templateName: getB2bApprovedTemplateName(),
                bodyParams: whatsappB2bApprovedTemplateParams(companyName),
              });
            }
          }
        )
      )
      .catch((e) => console.error("WhatsApp B2B approve notify:", e));

    return NextResponse.json({ profile: data, emailSent, emailTo: recipientEmail || null });
  }

  if (action === "reject") {
    const { error } = await admin
      .from("profiles")
      .update({ role: "b2c" })
      .eq("id", id)
      .eq("role", "b2b_pending");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let emailSent = false;
    if (recipientEmail) {
      try {
        const result = await sendB2bStatusEmail({
          to: recipientEmail,
          action: "reject",
          companyName,
          locale,
        });
        emailSent = result.ok === true;
      } catch (e) {
        console.error("B2B reject email:", e);
      }
    }

    return NextResponse.json({ success: true, emailSent, emailTo: recipientEmail || null });
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}
