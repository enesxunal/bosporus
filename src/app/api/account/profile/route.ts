import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name, phone, company_name, company_address, vat_id, locale")
    .eq("id", auth.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { firstName, lastName, phone, locale } = body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    locale?: "de" | "tr";
  };

  const first_name = firstName?.trim() ?? "";
  const last_name = lastName?.trim() ?? "";
  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone?.trim() || null,
      ...(locale ? { locale } : {}),
    })
    .eq("id", auth.user.id)
    .select("id, email, role, first_name, last_name, phone, company_name, locale")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const admin = createAdminClient();
  if (admin && fullName) {
    await admin.auth.admin.updateUserById(auth.user.id, {
      user_metadata: { full_name: fullName },
    });
  }

  return NextResponse.json({ profile: data });
}
