import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  MIDDLEWARE_AUTH_TIMEOUT_MS,
  hasSupabaseAuthCookies,
  updateSession,
} from "./middleware";

const AUTH_COOKIE = "sb-testproject-auth-token";
const SUPABASE_URL = "https://test.supabase.co";
const SUPABASE_KEY = "test-anon-key";

const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

function makeRequest(cookies?: Record<string, string>): NextRequest {
  const headers = cookies
    ? { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") }
    : undefined;
  return new NextRequest("https://www.bosporus-gmbh.com/products", { headers });
}

function makeResponse(): NextResponse {
  return NextResponse.next();
}

describe("hasSupabaseAuthCookies", () => {
  it("detects sb-*-auth-token cookies", () => {
    const request = makeRequest({ [AUTH_COOKIE]: "chunk" });
    expect(hasSupabaseAuthCookies(request)).toBe(true);
  });

  it("detects chunked auth cookie names", () => {
    const request = makeRequest({ "sb-testproject-auth-token.0": "chunk" });
    expect(hasSupabaseAuthCookies(request)).toBe(true);
  });

  it("returns false when no auth cookies are present", () => {
    const request = makeRequest({ "other-cookie": "value" });
    expect(hasSupabaseAuthCookies(request)).toBe(false);
  });
});

describe("updateSession", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_KEY);
    mockGetUser.mockReset();
    mockCreateServerClient.mockReset();
    mockCreateServerClient.mockReturnValue({
      auth: { getUser: mockGetUser },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("returns intl response without calling getUser when no auth cookie is present", async () => {
    const request = makeRequest();
    const response = makeResponse();

    const result = await updateSession(request, response);

    expect(result).toBe(response);
    expect(mockCreateServerClient).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("calls getUser and returns response on fast Supabase success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    const request = makeRequest({ [AUTH_COOKIE]: "token-value" });
    const response = makeResponse();

    const result = await updateSession(request, response);

    expect(result).toBe(response);
    expect(mockCreateServerClient).toHaveBeenCalledOnce();
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it("returns response without throwing when Supabase getUser times out", async () => {
    vi.useFakeTimers();
    mockGetUser.mockReturnValue(new Promise(() => {}));

    const request = makeRequest({ [AUTH_COOKIE]: "token-value" });
    const response = makeResponse();

    const pending = updateSession(request, response);
    await vi.advanceTimersByTimeAsync(MIDDLEWARE_AUTH_TIMEOUT_MS);
    const result = await pending;

    expect(result).toBe(response);
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it("returns response without throwing when Supabase getUser errors", async () => {
    mockGetUser.mockRejectedValue(new Error("Supabase Auth unavailable"));

    const request = makeRequest({ [AUTH_COOKIE]: "token-value" });
    const response = makeResponse();

    const result = await updateSession(request, response);

    expect(result).toBe(response);
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it("preserves cookie mutations from successful Supabase setAll", async () => {
    mockGetUser.mockImplementation(async () => {
      const [, , options] = mockCreateServerClient.mock.calls[0] as [
        string,
        string,
        {
          cookies: {
            setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
          };
        },
      ];
      options.cookies.setAll([
        { name: AUTH_COOKIE, value: "refreshed-token", options: { path: "/" } },
      ]);
      return { data: { user: { id: "user-1" } }, error: null };
    });

    const request = makeRequest({ [AUTH_COOKIE]: "stale-token" });
    const response = makeResponse();

    await updateSession(request, response);

    expect(response.cookies.get(AUTH_COOKIE)?.value).toBe("refreshed-token");
  });

  it("returns intl response when Supabase env is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const request = makeRequest({ [AUTH_COOKIE]: "token-value" });
    const response = makeResponse();

    const result = await updateSession(request, response);

    expect(result).toBe(response);
    expect(mockCreateServerClient).not.toHaveBeenCalled();
  });
});
