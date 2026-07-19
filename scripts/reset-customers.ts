/**
 * Müşteri hesapları + geçmiş siparişleri bir kerelik sıfırlar.
 * Admin kullanıcılar korunur.
 *
 * FORCE_RESET_CUSTOMERS=1 npx tsx scripts/reset-customers.ts
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  if (process.env.FORCE_RESET_CUSTOMERS !== "1") {
    console.log("reset-customers: FORCE_RESET_CUSTOMERS≠1 — atlandı");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.warn("reset-customers: Supabase env yok");
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("reset-customers: başlıyor…");

  const { count: orderCount } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true });

  const { error: itemsErr } = await admin
    .from("order_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (itemsErr) console.warn("order_items:", itemsErr.message);

  const { error: ordersErr } = await admin
    .from("orders")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (ordersErr) console.warn("orders:", ordersErr.message);
  else console.log(`✓ ${orderCount ?? "?"} sipariş silindi`);

  await admin.from("email_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("email_campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: admins } = await admin.from("profiles").select("id, email").eq("role", "admin");
  const adminIds = new Set((admins ?? []).map((a) => a.id as string));
  console.log(`Admin korunuyor: ${(admins ?? []).map((a) => a.email).join(", ") || "(yok)"}`);

  const { data: customers } = await admin
    .from("profiles")
    .select("id, email, role")
    .neq("role", "admin");

  for (const p of customers ?? []) {
    await admin.from("addresses").delete().eq("user_id", p.id);
    await admin.from("profiles").delete().eq("id", p.id);
    const { error: authErr } = await admin.auth.admin.deleteUser(p.id);
    if (authErr) console.warn(`auth ${p.email}:`, authErr.message);
    else console.log(`✓ kullanıcı silindi: ${p.email}`);
  }

  // Auth'ta kalıp profiles'ta olmayan kullanıcılar
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (adminIds.has(u.id)) continue;
      const { data: profile } = await admin.from("profiles").select("role").eq("id", u.id).maybeSingle();
      if (profile?.role === "admin") continue;
      if (profile) continue; // should already be deleted
      const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
      if (!delErr) console.log(`✓ orphan auth silindi: ${u.email}`);
    }
    if (data.users.length < 100) break;
    page += 1;
  }

  console.log("reset-customers: tamam");
}

main().catch((e) => {
  console.warn("reset-customers failed:", e);
});
