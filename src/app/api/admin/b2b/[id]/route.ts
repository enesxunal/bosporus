import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (action === "approve") {
    const { data, error } = await admin
      .from("profiles")
      .update({ role: "b2b_approved" })
      .eq("id", id)
      .eq("role", "b2b_pending")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  }

  if (action === "reject") {
    const { error } = await admin.from("profiles").update({ role: "b2c" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}
