import { describe, expect, it } from "vitest";
import { isPurchaseEligibleOrderStatus } from "./route";

describe("verified purchase analytics", () => {
  it("allows only paid or post-payment fulfillment states", () => {
    for (const state of ["paid", "preparing", "ready", "out_for_delivery", "delivered"]) {
      expect(isPurchaseEligibleOrderStatus(state)).toBe(true);
    }
  });
  it("never treats pending, cancelled, or guessed orders as purchases", () => {
    for (const state of ["", "pending", "cancelled", "failed", "refunded", "unknown"]) {
      expect(isPurchaseEligibleOrderStatus(state)).toBe(false);
    }
  });
});
