import { describe, expect, it } from "vitest";
import { summarizeDailyDistinctUsers, summarizeDistinctUsers } from "./b2b-funnel-admin";
import {
  dropOff,
  getFunnelInsights,
  percentage,
  type B2bFunnelSummary,
} from "./b2b-funnel-dashboard";

const summary: B2bFunnelSummary = {
  ok: true,
  days: 30,
  currentApproved: 24,
  approved: 24,
  firstLoginAfterApproval: 18,
  viewItem: 14,
  addToCart: 9,
  minOrderBlocked: 2,
  checkout: 3,
  purchase: 1,
  quickOrder: 4,
  favorite: 5,
  trend: [],
};

describe("admin funnel dashboard calculations", () => {
  it("0/0 oranında NaN veya Infinity üretmez", () => {
    expect(percentage(0, 0)).toBeNull();
    expect(percentage(1, 0)).toBeNull();
  });

  it("dönüşüm ve drop-off değerlerini hesaplar", () => {
    expect(percentage(18, 24)).toBe(75);
    expect(dropOff(9, 3)).toEqual({ count: 6, percentage: 66.66666666666666 });
    expect(dropOff(3, 5)).toEqual({ count: 0, percentage: 0 });
  });

  it("insight kurallarını yalnız gerçek eşikler sağlanınca üretir", () => {
    expect(
      getFunnelInsights({
        ...summary,
        firstLoginAfterApproval: 10,
        checkout: 2,
        purchase: 0,
        minOrderBlocked: 8,
      })
    ).toEqual([
      "lowReturnAfterApproval",
      "cartCheckoutDropoff",
      "checkoutWithoutPurchase",
    ]);
  });

  it("sıfır veride bekleme insight'ı üretir", () => {
    expect(
      getFunnelInsights({
        ...summary,
        approved: 0,
        firstLoginAfterApproval: 0,
        viewItem: 0,
        addToCart: 0,
        checkout: 0,
        purchase: 0,
      })
    ).toEqual(["waitingForData"]);
  });

  it("view, quick order ve favorileri event sayısı değil distinct kullanıcı sayar", () => {
    expect(
      summarizeDistinctUsers([
        { user_id: "u1", event_name: "approved_b2b_view_item" },
        { user_id: "u1", event_name: "approved_b2b_view_item" },
        { user_id: "u2", event_name: "approved_b2b_view_item" },
        { user_id: "u1", event_name: "quick_order_used" },
        { user_id: "u2", event_name: "favorite_used" },
      ])
    ).toMatchObject({ viewItem: 2, quickOrder: 1, favorite: 1 });
  });

  it("günlük trendde aynı kullanıcıyı aynı event için günde bir kez sayar", () => {
    expect(
      summarizeDailyDistinctUsers(
        [
          {
            user_id: "u1",
            event_name: "b2b_account_approved",
            created_at: "2026-08-14T08:00:00.000Z",
          },
          {
            user_id: "u1",
            event_name: "b2b_account_approved",
            created_at: "2026-08-14T10:00:00.000Z",
          },
          {
            user_id: "u2",
            event_name: "approved_b2b_purchase",
            created_at: "2026-08-15T09:00:00.000Z",
          },
        ],
        7,
        new Date("2026-08-15T12:00:00.000Z")
      ).slice(-2)
    ).toEqual([
      {
        date: "2026-08-14",
        approved: 1,
        firstLoginAfterApproval: 0,
        addToCart: 0,
        checkout: 0,
        purchase: 0,
      },
      {
        date: "2026-08-15",
        approved: 0,
        firstLoginAfterApproval: 0,
        addToCart: 0,
        checkout: 0,
        purchase: 1,
      },
    ]);
  });
});
