import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

/** SEO/feed routes – locale middleware must not treat as [locale] */
const BYPASS_INTL_PREFIXES = ["/llms.txt", "/feeds/", "/robots.txt", "/sitemap.xml"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (BYPASS_INTL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return updateSession(request, NextResponse.next());
  }
  const response = intlMiddleware(request);
  return updateSession(request, response);
}

export const config = {
  // /auth/* locale middleware dışında kalsın (kayıt onay linki 404 olmasın)
  matcher: ["/", "/(de|tr)/:path*", "/((?!api|auth|_next|.*\\..*).*)"],
};
