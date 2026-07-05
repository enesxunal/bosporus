import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

export async function requireAdmin() {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("id, email, role, first_name, last_name")
    .eq("id", auth.user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Kein Admin-Zugriff" }, { status: 403 }),
    };
  }

  return { ok: true as const, user: auth.user, supabase: auth.supabase, profile };
}
