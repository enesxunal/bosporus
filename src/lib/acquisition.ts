export const ACQUISITION_STORAGE_KEY = "bosporus-first-touch";

export const ACQUISITION_SOURCES = [
  "google_ads",
  "facebook",
  "instagram",
  "tiktok",
  "organic",
  "direct",
  "referral",
  "unknown",
] as const;

export const ACQUISITION_MEDIUMS = [
  "paid",
  "social",
  "organic",
  "direct",
  "referral",
  "unknown",
] as const;

export const CLICK_ID_TYPES = ["gclid", "fbclid", "ttclid"] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];
export type AcquisitionMedium = (typeof ACQUISITION_MEDIUMS)[number];
export type ClickIdType = (typeof CLICK_ID_TYPES)[number];

export interface FirstTouchPayload {
  source: AcquisitionSource;
  medium: AcquisitionMedium;
  campaign: string | null;
  clickIdType: ClickIdType | null;
  landingPath: string;
  capturedAt: string;
}

interface NormalizeAcquisitionInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | boolean | null;
  fbclid?: string | boolean | null;
  ttclid?: string | boolean | null;
  referrer?: string | null;
  currentHostname?: string | null;
  landingPath?: string | null;
  capturedAt?: string;
}

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paid_social", "display"]);
const SEARCH_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo."];

function cleanToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hasClickId(value: string | boolean | null | undefined): boolean {
  return value === true || (typeof value === "string" && value.trim().length > 0);
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

export function sanitizeCampaign(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const campaign = value.trim().toLowerCase();
  if (
    campaign.length === 0 ||
    campaign.length > 100 ||
    campaign.includes("@") ||
    /\d{7,}/.test(campaign) ||
    !/^[a-z0-9][a-z0-9._~-]*$/.test(campaign)
  ) {
    return null;
  }
  return campaign;
}

export function sanitizeLandingPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.slice(0, 160);
  if (
    !path.startsWith("/") ||
    path.includes("@") ||
    /%40/i.test(path) ||
    /\d{7,}/.test(path) ||
    !/^\/[a-zA-Z0-9/._~-]*$/.test(path)
  ) {
    return "/";
  }
  return path;
}

function referrerCategory(
  referrer: string | null | undefined,
  currentHostname: string | null | undefined
): "google" | "facebook" | "instagram" | "tiktok" | "search" | "direct" | "referral" {
  if (!referrer) return "direct";

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    const ownHostname = cleanToken(currentHostname);
    if (!hostname || (ownHostname && hostname === ownHostname)) return "direct";
    if (hostname.includes("instagram.")) return "instagram";
    if (hostname.includes("facebook.") || hostname === "fb.com") return "facebook";
    if (hostname.includes("tiktok.")) return "tiktok";
    if (SEARCH_HOSTS.some((searchHost) => hostname.includes(searchHost))) {
      return hostname.includes("google.") ? "google" : "search";
    }
    return "referral";
  } catch {
    return "direct";
  }
}

export function normalizeAcquisition(input: NormalizeAcquisitionInput): FirstTouchPayload {
  const sourceToken = cleanToken(input.utmSource);
  const mediumToken = cleanToken(input.utmMedium);
  const referrer = referrerCategory(input.referrer, input.currentHostname);
  const paid = PAID_MEDIUMS.has(mediumToken);
  const gclid = hasClickId(input.gclid);
  const fbclid = hasClickId(input.fbclid);
  const ttclid = hasClickId(input.ttclid);

  let source: AcquisitionSource;
  let medium: AcquisitionMedium;
  let clickIdType: ClickIdType | null = null;

  if (gclid) {
    source = "google_ads";
    medium = "paid";
    clickIdType = "gclid";
  } else if (ttclid) {
    source = "tiktok";
    medium = "paid";
    clickIdType = "ttclid";
  } else if (sourceToken === "instagram" || sourceToken === "ig") {
    source = "instagram";
    medium = paid ? "paid" : "social";
    clickIdType = fbclid ? "fbclid" : null;
  } else if (
    fbclid ||
    sourceToken === "facebook" ||
    sourceToken === "fb" ||
    sourceToken === "meta"
  ) {
    source = "facebook";
    medium = paid || fbclid ? "paid" : "social";
    clickIdType = fbclid ? "fbclid" : null;
  } else if (sourceToken === "tiktok") {
    source = "tiktok";
    medium = paid ? "paid" : "social";
  } else if (sourceToken === "google" && paid) {
    source = "google_ads";
    medium = "paid";
  } else if (
    sourceToken === "google" ||
    sourceToken === "bing" ||
    sourceToken === "yahoo" ||
    sourceToken === "duckduckgo" ||
    referrer === "google" ||
    referrer === "search"
  ) {
    source = "organic";
    medium = "organic";
  } else if (referrer === "facebook" || referrer === "instagram" || referrer === "tiktok") {
    source = referrer;
    medium = "social";
  } else if (sourceToken) {
    source = "referral";
    medium = "referral";
  } else if (mediumToken) {
    source = "unknown";
    medium = "unknown";
  } else if (referrer === "referral") {
    source = "referral";
    medium = "referral";
  } else {
    source = "direct";
    medium = "direct";
  }

  return {
    source,
    medium,
    campaign: sanitizeCampaign(input.utmCampaign),
    clickIdType,
    landingPath: sanitizeLandingPath(input.landingPath),
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  };
}

export function firstTouchFromUrl(
  href: string,
  referrer: string | null | undefined,
  capturedAt?: string
): FirstTouchPayload {
  const url = new URL(href);
  const params = url.searchParams;

  // utm_content and utm_term are intentionally observed but not persisted:
  // their raw values are unnecessary for source attribution and may contain PII.
  void params.get("utm_content");
  void params.get("utm_term");

  return normalizeAcquisition({
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    ttclid: params.get("ttclid"),
    referrer,
    currentHostname: url.hostname,
    landingPath: url.pathname,
    capturedAt,
  });
}

export function storeFirstTouch(storage: Storage, payload: FirstTouchPayload): boolean {
  if (storage.getItem(ACQUISITION_STORAGE_KEY)) return false;
  storage.setItem(ACQUISITION_STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function parseFirstTouch(value: string | null): FirstTouchPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      !isOneOf(ACQUISITION_SOURCES, parsed.source) ||
      !isOneOf(ACQUISITION_MEDIUMS, parsed.medium) ||
      (parsed.clickIdType !== null && !isOneOf(CLICK_ID_TYPES, parsed.clickIdType)) ||
      typeof parsed.capturedAt !== "string"
    ) {
      return null;
    }
    return {
      source: parsed.source,
      medium: parsed.medium,
      campaign: sanitizeCampaign(parsed.campaign),
      clickIdType: parsed.clickIdType as ClickIdType | null,
      landingPath: sanitizeLandingPath(parsed.landingPath),
      capturedAt: parsed.capturedAt,
    };
  } catch {
    return null;
  }
}

export function parseAcquisitionClaim(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (
    !isOneOf(ACQUISITION_SOURCES, value.source) ||
    !isOneOf(ACQUISITION_MEDIUMS, value.medium) ||
    (value.clickIdType !== null &&
      value.clickIdType !== undefined &&
      !isOneOf(CLICK_ID_TYPES, value.clickIdType))
  ) {
    return null;
  }

  const clickIdType = (value.clickIdType ?? null) as ClickIdType | null;
  let source = value.source;
  if (clickIdType === "gclid") source = "google_ads";
  if (clickIdType === "fbclid" && source !== "instagram") source = "facebook";
  if (clickIdType === "ttclid") source = "tiktok";

  const canonicalMedium: Record<AcquisitionSource, AcquisitionMedium> = {
    google_ads: "paid",
    facebook: value.medium === "paid" ? "paid" : "social",
    instagram: value.medium === "paid" ? "paid" : "social",
    tiktok: value.medium === "paid" ? "paid" : "social",
    organic: "organic",
    direct: "direct",
    referral: "referral",
    unknown: "unknown",
  };

  const capturedAt = new Date(typeof value.capturedAt === "string" ? value.capturedAt : "");
  const now = Date.now();
  const validCapturedAt =
    Number.isFinite(capturedAt.getTime()) &&
    capturedAt.getTime() <= now + 5 * 60_000 &&
    capturedAt.getTime() >= now - 366 * 86_400_000;

  return {
    source,
    medium: canonicalMedium[source],
    campaign: sanitizeCampaign(value.campaign),
    clickIdType,
    firstSeenAt: validCapturedAt ? capturedAt.toISOString() : new Date(now).toISOString(),
  };
}

export function isClaimWithinSignupWindow(
  firstSeenAt: string,
  userCreatedAt: string
): boolean {
  const firstSeen = new Date(firstSeenAt).getTime();
  const userCreated = new Date(userCreatedAt).getTime();
  if (!Number.isFinite(firstSeen) || !Number.isFinite(userCreated)) return false;

  return (
    firstSeen >= userCreated - 90 * 86_400_000 &&
    firstSeen <= userCreated + 24 * 60 * 60_000
  );
}
