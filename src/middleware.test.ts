import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { mockGetUser, mockCreateServerClient, mockIntlHandler } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockCreateServerClient: vi.fn(),
  mockIntlHandler: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => mockIntlHandler),
}));

vi.mock("./i18n/routing", () => ({
  routing: { locales: ["de", "tr"], defaultLocale: "de" },
}));

import { middleware } from "./middleware";

function makeRequest(path: string, cookies?: Record<string, string>) {
  const headers = cookies
    ? { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") }
    : undefined;
  return new NextRequest(`https://www.bosporus-gmbh.com${path}`, { headers });
}

describe("middleware locale routing", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    mockGetUser.mockReset();
    mockCreateServerClient.mockReset();
    mockCreateServerClient.mockReturnValue({
      auth: { getUser: mockGetUser },
    });
    mockIntlHandler.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns intl next() response for /products without Supabase auth call", async () => {
    const intlResponse = NextResponse.next();
    mockIntlHandler.mockReturnValue(intlResponse);

    const response = await middleware(makeRequest("/products"));

    expect(response).toBe(intlResponse);
    expect(mockIntlHandler).toHaveBeenCalledOnce();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns intl next() response for /tr/products without Supabase auth call", async () => {
    const intlResponse = NextResponse.next();
    mockIntlHandler.mockReturnValue(intlResponse);

    const response = await middleware(makeRequest("/tr/products"));

    expect(response).toBe(intlResponse);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("preserves intl redirect responses unchanged", async () => {
    const request = makeRequest("/de/products");
    const redirect = NextResponse.redirect(new URL("/products", request.url));
    mockIntlHandler.mockReturnValue(redirect);

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://www.bosporus-gmbh.com/products");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns intl response when auth cookie triggers Supabase timeout", async () => {
    vi.useFakeTimers();
    const intlResponse = NextResponse.next();
    mockIntlHandler.mockReturnValue(intlResponse);
    mockGetUser.mockReturnValue(new Promise(() => {}));

    const pending = middleware(
      makeRequest("/products", { "sb-testproject-auth-token": "token" })
    );
    await vi.advanceTimersByTimeAsync(2500);
    const response = await pending;

    expect(response).toBe(intlResponse);
    expect(mockGetUser).toHaveBeenCalledOnce();
  });
});
