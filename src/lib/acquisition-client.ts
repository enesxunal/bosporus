"use client";

import {
  ACQUISITION_STORAGE_KEY,
  firstTouchFromUrl,
  parseFirstTouch,
  storeFirstTouch,
  type FirstTouchPayload,
} from "./acquisition";

let claimInFlight: Promise<void> | null = null;

export function ensureFirstTouchCaptured(): FirstTouchPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const existingRaw = window.localStorage.getItem(ACQUISITION_STORAGE_KEY);
    if (existingRaw) return parseFirstTouch(existingRaw);

    const payload = firstTouchFromUrl(window.location.href, document.referrer);
    storeFirstTouch(window.localStorage, payload);
    return payload;
  } catch {
    return null;
  }
}

export function claimStoredAcquisition(): Promise<void> {
  if (claimInFlight) return claimInFlight;

  const payload = ensureFirstTouchCaptured();
  if (!payload) return Promise.resolve();

  claimInFlight = fetch("/api/acquisition/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) return;
      try {
        window.localStorage.removeItem(ACQUISITION_STORAGE_KEY);
      } catch {
        // A successful server claim remains source of truth if storage is unavailable.
      }
    })
    .catch(() => undefined)
    .finally(() => {
      claimInFlight = null;
    });

  return claimInFlight;
}
