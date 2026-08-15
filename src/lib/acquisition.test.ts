import { describe, expect, it } from "vitest";
import {
  firstTouchFromUrl,
  isClaimWithinSignupWindow,
  normalizeAcquisition,
  parseAcquisitionClaim,
  storeFirstTouch,
} from "./acquisition";
import { claimUserAcquisition } from "./acquisition-server";
import { summarizeSourceDistinctUsers } from "./b2b-funnel-admin";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function fakeAdmin(options?: { duplicate?: boolean }) {
  const inserts: Record<string, unknown>[] = [];
  return {
    inserts,
    admin: {
      from() {
        return {
          async insert(row: Record<string, unknown>) {
            inserts.push(row);
            return options?.duplicate
              ? { error: { code: "23505", message: "duplicate" } }
              : { error: null };
          },
        };
      },
    } as never,
  };
}

describe("acquisition source normalization", () => {
  it("gclid varsa Google Ads sınıflandırır ve ham click id saklamaz", () => {
    const result = firstTouchFromUrl(
      "https://example.com/de/products?gclid=secret-click-value&utm_content=customer%40example.com&utm_term=%2B49123456789",
      "",
      "2026-08-15T10:00:00.000Z"
    );
    expect(result).toMatchObject({
      source: "google_ads",
      medium: "paid",
      clickIdType: "gclid",
    });
    expect(JSON.stringify(result)).not.toContain("secret-click-value");
    expect(JSON.stringify(result)).not.toContain("customer@example.com");
    expect(JSON.stringify(result)).not.toContain("+49123456789");
  });

  it("fbclid Facebook, Instagram UTM Instagram, ttclid TikTok sınıflandırır", () => {
    expect(normalizeAcquisition({ fbclid: "x" }).source).toBe("facebook");
    expect(normalizeAcquisition({ utmSource: "ig", fbclid: "x" }).source).toBe(
      "instagram"
    );
    expect(normalizeAcquisition({ ttclid: "x" }).source).toBe("tiktok");
  });

  it("search referrer organic, boş geliş direct, başka domain referral olur", () => {
    expect(
      normalizeAcquisition({
        referrer: "https://www.google.de/search?q=bosporus",
        currentHostname: "bosporus-gmbh.com",
      }).source
    ).toBe("organic");
    expect(normalizeAcquisition({}).source).toBe("direct");
    expect(
      normalizeAcquisition({
        referrer: "https://partner.example/path",
        currentHostname: "bosporus-gmbh.com",
      }).source
    ).toBe("referral");
  });

  it("yalnız medium bulunan belirsiz geliş unknown olur", () => {
    expect(normalizeAcquisition({ utmMedium: "mystery" }).source).toBe("unknown");
  });

  it("first-touch storage mevcut değeri overwrite etmez", () => {
    const storage = new MemoryStorage();
    const first = normalizeAcquisition({ gclid: true });
    const second = normalizeAcquisition({ fbclid: true });
    expect(storeFirstTouch(storage, first)).toBe(true);
    expect(storeFirstTouch(storage, second)).toBe(false);
    expect(storage.getItem("bosporus-first-touch")).toContain("google_ads");
    expect(storage.getItem("bosporus-first-touch")).not.toContain("facebook");
  });

  it("yeni hesap claim'ine izin verir, tarihsel kullanıcı ziyaretini reddeder", () => {
    expect(
      isClaimWithinSignupWindow(
        "2026-08-14T10:00:00.000Z",
        "2026-08-15T10:00:00.000Z"
      )
    ).toBe(true);
    expect(
      isClaimWithinSignupWindow(
        "2026-08-15T10:00:00.000Z",
        "2024-01-01T10:00:00.000Z"
      )
    ).toBe(false);
  });
});

describe("acquisition claim security", () => {
  it("PII ve client user_id alanlarını allowlist dışında bırakır", () => {
    const claim = parseAcquisitionClaim({
      source: "facebook",
      medium: "social",
      campaign: "customer@example.com",
      clickIdType: null,
      capturedAt: new Date().toISOString(),
      user_id: "spoofed-user",
      email: "customer@example.com",
      phone: "+49123456789",
      company: "Private GmbH",
    });
    expect(claim).toMatchObject({
      source: "facebook",
      medium: "social",
      campaign: null,
    });
    expect(claim).not.toHaveProperty("user_id");
    expect(claim).not.toHaveProperty("email");
    expect(claim).not.toHaveProperty("phone");
    expect(claim).not.toHaveProperty("company");
  });

  it("session user id ile insert eder; body user id kullanmaz", async () => {
    const { admin, inserts } = fakeAdmin();
    const claim = parseAcquisitionClaim({
      source: "direct",
      medium: "direct",
      campaign: null,
      clickIdType: null,
      capturedAt: new Date().toISOString(),
      user_id: "attacker-selected-user",
    });
    expect(claim).not.toBeNull();
    await claimUserAcquisition({
      userId: "session-user",
      claim: claim!,
      admin,
    });
    expect(inserts[0]?.user_id).toBe("session-user");
  });

  it("mevcut acquisition kaydında duplicate başarılı NO-OP olur", async () => {
    const { admin } = fakeAdmin({ duplicate: true });
    const claim = parseAcquisitionClaim({
      source: "organic",
      medium: "organic",
      clickIdType: null,
      capturedAt: new Date().toISOString(),
    });
    await expect(
      claimUserAcquisition({ userId: "existing-user", claim: claim!, admin })
    ).resolves.toEqual({ ok: true, claimed: false, existing: true });
  });
});

describe("source breakdown aggregation", () => {
  it("event count değil distinct user sayar ve eksik attribution'ı unknown yapar", () => {
    const result = summarizeSourceDistinctUsers(
      [
        { user_id: "u1", event_name: "b2b_account_approved" },
        { user_id: "u1", event_name: "b2b_account_approved" },
        { user_id: "u1", event_name: "approved_b2b_purchase" },
        { user_id: "u2", event_name: "b2b_account_approved" },
        { user_id: "u2", event_name: "approved_b2b_view_item" },
      ],
      [{ user_id: "u1", source: "google_ads" }]
    );

    expect(result.find((row) => row.source === "google_ads")).toMatchObject({
      approved: 1,
      purchase: 1,
    });
    expect(result.find((row) => row.source === "unknown")).toMatchObject({
      approved: 1,
      viewItem: 1,
    });
  });
});
