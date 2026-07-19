import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 20;
const MAX_BYTES = 5 * 1024 * 1024;

function skuFromFilename(name: string): string | null {
  const base = name.split(/[/\\]/).pop() ?? name;
  const m = base.match(/^(.+)\.(jpe?g|png|webp)$/i);
  if (!m) return null;
  const sku = m[1].trim();
  return sku || null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "DB error" }, { status: 503 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `En fazla ${MAX_FILES} dosya gönderin` },
      { status: 400 }
    );
  }

  const results: { sku: string; ok: boolean; url?: string; error?: string }[] = [];

  for (const file of files) {
    const sku = skuFromFilename(file.name);
    if (!sku) {
      results.push({ sku: file.name, ok: false, error: "Dosya adı SKU.jpg olmalı" });
      continue;
    }
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      results.push({ sku, ok: false, error: "Sadece görsel" });
      continue;
    }
    if (file.size > MAX_BYTES) {
      results.push({ sku, ok: false, error: "Dosya 5 MB'dan büyük" });
      continue;
    }

    const storagePath = `products/${sku}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";

    const { error: upErr } = await admin.storage
      .from("product-images")
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (upErr) {
      results.push({ sku, ok: false, error: upErr.message });
      continue;
    }

    const { data: pub } = admin.storage
      .from("product-images")
      .getPublicUrl(storagePath);
    const url = pub.publicUrl;

    const { data: updated, error: dbErr } = await admin
      .from("products")
      .update({ image_url: url, image_urls: [url] })
      .eq("sku", sku)
      .select("id");

    if (dbErr) {
      results.push({ sku, ok: false, error: `db: ${dbErr.message}` });
      continue;
    }
    if (!updated?.length) {
      results.push({ sku, ok: false, error: "Ürün bulunamadı (SKU)" });
      continue;
    }

    results.push({ sku, ok: true, url });
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  return NextResponse.json({ ok, fail, results });
}
