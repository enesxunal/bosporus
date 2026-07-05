import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: products, error } = await admin
    .from("products")
    .select("id, sku, name_de, name_tr, description_de, description_tr, image_url, image_urls, is_active")
    .order("name_de");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const gaps = (products ?? [])
    .map((p) => {
      const images = (p.image_urls as string[] | null) ?? [];
      const hasImage = Boolean(p.image_url) || images.length > 0;
      const missing: string[] = [];
      if (!p.name_tr?.trim()) missing.push("name_tr");
      if (!p.description_de?.trim()) missing.push("description_de");
      if (!p.description_tr?.trim()) missing.push("description_tr");
      if (!hasImage) missing.push("image");
      return { ...p, missing, missingCount: missing.length };
    })
    .filter((p) => p.missingCount > 0);

  return NextResponse.json({
    total: products?.length ?? 0,
    incomplete: gaps.length,
    products: gaps,
  });
}
