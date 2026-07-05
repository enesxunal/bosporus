/**
 * Einmalig ausführen: Admin-Benutzer ohne E-Mail-Bestätigung anlegen.
 *
 * ADMIN_EMAIL=info@... ADMIN_PASSWORD=... npx tsx scripts/create-admin.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!email || !password) {
  console.error("ADMIN_EMAIL und ADMIN_PASSWORD setzen.");
  process.exit(1);
}
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local fehlen.");
  console.error("Tipp: npx vercel env pull --environment=production .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("Passwort-Update fehlgeschlagen:", error.message);
      process.exit(1);
    }
    console.log("Bestehender Benutzer aktualisiert:", email);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Bosporus Admin", role: "admin" },
    });
    if (error || !data.user) {
      console.error("Benutzer erstellen fehlgeschlagen:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("Neuer Benutzer erstellt:", email);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role: "admin",
      first_name: "Bosporus",
      last_name: "Admin",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Profil fehlgeschlagen:", profileError.message);
    process.exit(1);
  }

  console.log("Admin-Rolle gesetzt. Login: /login → dann /admin");
}

main();
