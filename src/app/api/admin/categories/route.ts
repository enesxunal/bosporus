import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCategoriesFromJson, loadCategoriesFromDb } from "@/lib/categories-sync";
import categoriesData from "@/data/categories.json";
import type { Category } from "@/lib/types";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const db = await loadCategoriesFromDb();
  const categories = db ?? (categoriesData as Category[]);
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (body.action === "sync") {
    const result = await syncCategoriesFromJson();
    return NextResponse.json(result);
  }

  const { slug, name_de, name_tr, sort_order } = body as {
    slug?: string;
    name_de?: string;
    name_tr?: string;
    sort_order?: number;
  };

  if (!slug?.trim() || !name_de?.trim()) {
    return NextResponse.json({ error: "Slug ve Almanca ad gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data, error } = await admin
    .from("categories")
    .insert({
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      name_de: name_de.trim(),
      name_tr: name_tr?.trim() || null,
      sort_order: sort_order ?? 99,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
