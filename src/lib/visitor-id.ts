import { FIRST_PARTY_ID_PATTERN, type DeviceCategory } from "./site-funnel-shared";

export const ANON_ID_KEY = "bosporus_anon_id";
export const SESSION_ID_KEY = "bosporus_session_id";
export const SESSION_TS_KEY = "bosporus_session_ts";

/** Session is considered fresh within 30 minutes of the last activity. */
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to manual generation
  }
  // Opaque, PII-free fallback identifier.
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function readValidId(storage: Storage, key: string): string | null {
  try {
    const value = storage.getItem(key);
    return value && FIRST_PARTY_ID_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Stable, opaque first-party visitor id. Not derived from any PII, IP, or
 * browser fingerprint — just a random token persisted in localStorage.
 */
export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = readValidId(window.localStorage, ANON_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    window.localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
}

/**
 * Session id that rotates after 30 minutes of inactivity. Distinct from the
 * visitor id so we can report both distinct visitors and distinct sessions.
 */
export function getSessionId(now: number = Date.now()): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const existing = readValidId(storage, SESSION_ID_KEY);
    const lastTs = Number(storage.getItem(SESSION_TS_KEY));
    const fresh =
      existing !== null &&
      Number.isFinite(lastTs) &&
      now - lastTs <= SESSION_INACTIVITY_MS;

    const sessionId = fresh && existing ? existing : randomId();
    storage.setItem(SESSION_ID_KEY, sessionId);
    storage.setItem(SESSION_TS_KEY, String(now));
    return sessionId;
  } catch {
    return null;
  }
}

/**
 * Coarse device category derived from viewport + touch hints only.
 * No user-agent string is persisted anywhere; this never leaves as raw UA.
 */
export function getDeviceCategory(): DeviceCategory | null {
  if (typeof window === "undefined") return null;
  try {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (width > 0 && width < 640) return "mobile";
    if (width >= 640 && width < 1024 && coarsePointer) return "tablet";
    if (width >= 1024) return "desktop";
    // Narrow but pointer-precise, or unknown width with touch.
    return coarsePointer ? "tablet" : "desktop";
  } catch {
    return null;
  }
}
