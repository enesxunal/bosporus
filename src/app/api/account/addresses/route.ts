import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("addresses")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: data });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { label, street, zipCode, city, isDefault } = body as {
    label?: string;
    street: string;
    zipCode: string;
    city?: string;
    isDefault?: boolean;
  };

  if (!street?.trim() || !zipCode?.trim()) {
    return NextResponse.json({ error: "Straße und PLZ erforderlich" }, { status: 400 });
  }

  if (isDefault) {
    await auth.supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", auth.user.id);
  }

  const { data, error } = await auth.supabase
    .from("addresses")
    .insert({
      user_id: auth.user.id,
      label: label?.trim() || "Home",
      street: street.trim(),
      zip_code: zipCode.trim(),
      city: city?.trim() || "Köln",
      is_default: isDefault ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ address: data });
}
