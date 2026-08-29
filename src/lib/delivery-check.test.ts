import { describe, expect, it } from "vitest";
import {
  assertNoB2cPublicLeak,
  classifyDeliveryCheck,
  isValidGermanPlz,
  normalizeGermanPlz,
  type PublicDeliveryCheck,
  zoneNames,
} from "./delivery-check";

describe("normalizeGermanPlz / isValidGermanPlz", () => {
  it("5 haneli PLZ kabul", () => {
    expect(isValidGermanPlz("50829")).toBe(true);
    expect(normalizeGermanPlz(" 50 829 ")).toBe("50829");
    expect(isValidGermanPlz(" 50829 ")).toBe(true);
  });
  it("invalid PLZ reddeder", () => {
    expect(isValidGermanPlz("5082")).toBe(false);
    expect(isValidGermanPlz("508299")).toBe(false);
    expect(isValidGermanPlz("abcde")).toBe(false);
    expect(isValidGermanPlz("")).toBe(false);
    expect(isValidGermanPlz(null)).toBe(false);
  });
});

describe("classifyDeliveryCheck", () => {
  it("serviceable", () => {
    expect(classifyDeliveryCheck({ distanceKm: 12, withinRadius: true })).toBe(
      "serviceable"
    );
  });
  it("out_of_range", () => {
    expect(classifyDeliveryCheck({ distanceKm: 80, withinRadius: false })).toBe(
      "out_of_range"
    );
  });
  it("uncertain when geocoder fail", () => {
    expect(classifyDeliveryCheck({ distanceKm: null, withinRadius: false })).toBe(
      "uncertain"
    );
  });
});

describe("zoneNames", () => {
  it("null zone", () => {
    expect(zoneNames(null)).toEqual({ zoneNameDe: null, zoneNameTr: null });
  });
});

describe("assertNoB2cPublicLeak", () => {
  const base: PublicDeliveryCheck = {
    zipCode: "50829",
    status: "serviceable",
    serviceable: true,
    zoneNameDe: "Köln Zentrum",
    zoneNameTr: "Köln Merkez",
    minOrderAmount: 500,
    freeDeliveryThreshold: 2500,
    deliveryFeeEstimate: 20,
    maxDistanceKm: 50,
    distanceKm: 5,
    withinRadius: true,
    pickupAvailable: true,
    pickupOpen: "00:00",
    pickupClose: "18:00",
    storeHoursDe: "Mo.–Fr.: 00:00–18:00 Uhr, Sa.: 00:00–16:00 Uhr, So.: geschlossen",
    storeHoursTr: "Pzt.–Cum.: 00:00–18:00, Cmt.: 00:00–16:00, Paz.: kapalı",
    segment: "b2b_delivery",
  };

  it("B2B 500/2500 geçer", () => {
    expect(assertNoB2cPublicLeak(base)).toBe(true);
  });
  it("eski 100/250 sızıntısını engeller", () => {
    expect(assertNoB2cPublicLeak({ ...base, minOrderAmount: 100 })).toBe(false);
    expect(
      assertNoB2cPublicLeak({ ...base, freeDeliveryThreshold: 250 })
    ).toBe(false);
  });
});
