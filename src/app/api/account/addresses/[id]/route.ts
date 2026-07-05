import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { label, street, zipCode, city, isDefault } = body as {
    label?: string;
    street?: string;
    zipCode?: string;
    city?: string;
    isDefault?: boolean;
  };

  if (isDefault) {
    await auth.supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", auth.user.id);
  }

  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label.trim() || "Home";
  if (street !== undefined) updates.street = street.trim();
  if (zipCode !== undefined) updates.zip_code = zipCode.trim();
  if (city !== undefined) updates.city = city.trim() || "Köln";
  if (isDefault !== undefined) updates.is_default = isDefault;

  const { data, error } = await auth.supabase
    .from("addresses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ address: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
