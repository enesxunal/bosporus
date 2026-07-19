import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PKCE code exchange (server-side cookies). Called from /auth/callback page. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/login";
  const safeNext = next.startsWith("/") ? next : "/login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
