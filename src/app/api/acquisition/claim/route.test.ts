import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { POST } from "./route";

describe("POST /api/acquisition/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated isteği 401 ile reddeder", async () => {
    mocks.requireUser.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Nicht angemeldet" }, { status: 401 }),
    });

    const response = await POST(
      new Request("https://example.com/api/acquisition/claim", {
        method: "POST",
        body: JSON.stringify({ source: "direct" }),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });
});
