import { describe, expect, it } from "vitest";
import {
  applyOptimisticFavorite,
  assertFavoriteOwnership,
  filterProductsByFavorites,
  isUniqueViolation,
  isValidProductId,
  parseFavoriteProductId,
} from "./favorites";

const PID = "11111111-1111-4111-8111-111111111111";

describe("isValidProductId", () => {
  it("kabul eder", () => {
    expect(isValidProductId(PID)).toBe(true);
  });
  it("geçersizleri reddeder", () => {
    expect(isValidProductId("sku-123")).toBe(false);
    expect(isValidProductId("")).toBe(false);
    expect(isValidProductId(null)).toBe(false);
  });
});

describe("parseFavoriteProductId", () => {
  it("productId parse eder", () => {
    expect(parseFavoriteProductId({ productId: PID })).toEqual({
      ok: true,
      productId: PID,
    });
  });
  it("eksik body → 400", () => {
    expect(parseFavoriteProductId(null).ok).toBe(false);
    expect(parseFavoriteProductId({}).ok).toBe(false);
  });
});

describe("isUniqueViolation", () => {
  it("23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "42501" })).toBe(false);
  });
});

describe("assertFavoriteOwnership", () => {
  it("kendi satırı", () => {
    expect(assertFavoriteOwnership({ requesterId: "u1", rowUserId: "u1" })).toEqual({
      ok: true,
    });
  });
  it("başka kullanıcı → 403", () => {
    expect(assertFavoriteOwnership({ requesterId: "u1", rowUserId: "u2" })).toEqual({
      ok: false,
      status: 403,
    });
  });
  it("yok → 404", () => {
    expect(assertFavoriteOwnership({ requesterId: "u1", rowUserId: null })).toEqual({
      ok: false,
      status: 404,
    });
  });
});

describe("applyOptimisticFavorite", () => {
  it("ekler", () => {
    const prev = new Set<string>();
    const next = applyOptimisticFavorite(prev, PID, true);
    expect(next.has(PID)).toBe(true);
    expect(prev.has(PID)).toBe(false);
  });
  it("çıkarır (rollback için önceki Set korunur)", () => {
    const prev = new Set([PID]);
    const next = applyOptimisticFavorite(prev, PID, false);
    expect(next.has(PID)).toBe(false);
    expect(prev.has(PID)).toBe(true);
  });
});

describe("filterProductsByFavorites", () => {
  const products = [{ id: PID }, { id: "22222222-2222-4222-8222-222222222222" }];
  it("kapalıyken tümünü bırakır", () => {
    expect(filterProductsByFavorites(products, new Set([PID]), false)).toHaveLength(2);
  });
  it("sadece favorileri filtreler", () => {
    expect(filterProductsByFavorites(products, new Set([PID]), true)).toEqual([{ id: PID }]);
  });
});
