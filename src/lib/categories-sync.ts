import categoriesData from "@/data/categories.json";
import type { Category } from "./types";
import { createAdminClient } from "./supabase/admin";

export async function syncCategoriesFromJson(): Promise<{ synced: number; errors: string[] }> {
  const admin = createAdminClient();
  if (!admin) return { synced: 0, errors: ["Veritabanı bağlantısı yok"] };

  const categories = categoriesData as (Category & { product_count?: number })[];
  const errors: string[] = [];
  let synced = 0;

  const batch = categories.map((c, i) => ({
    id: c.id,
    slug: c.slug,
    name_de: c.name_de,
    name_tr: c.name_tr,
    sort_order: c.sort_order ?? i,
  }));

  const { error } = await admin.from("categories").upsert(batch, { onConflict: "slug" });
  if (error) {
    errors.push(error.message);
  } else {
    synced = batch.length;
  }

  return { synced, errors };
}

export async function loadCategoriesFromDb(): Promise<Category[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { count } = await admin.from("categories").select("id", { count: "exact", head: true });
  if (!count || count === 0) return null;

  const { data } = await admin.from("categories").select("*").order("sort_order");
  return (data ?? []) as Category[];
}
