import { describe, expect, it } from "vitest";
import {
  STORE_OPENING_HOURS,
  storeOpeningHoursJsonLd,
  storeOpeningHoursLineDe,
  storeWeekdayPickupHours,
} from "./company";

describe("store opening hours", () => {
  it("weekday hours 00:00–18:00", () => {
    for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday"] as const) {
      expect(STORE_OPENING_HOURS[day]).toEqual({ opens: "00:00", closes: "18:00" });
    }
  });

  it("saturday 00:00–16:00, sunday closed", () => {
    expect(STORE_OPENING_HOURS.saturday).toEqual({ opens: "00:00", closes: "16:00" });
    expect(STORE_OPENING_HOURS.sunday).toBeNull();
  });

  it("display line mentions correct hours, not 08:00", () => {
    const line = storeOpeningHoursLineDe();
    expect(line).toContain("00:00–18:00");
    expect(line).toContain("00:00–16:00");
    expect(line).toContain("geschlossen");
    expect(line).not.toContain("08:00");
  });

  it("JSON-LD has separate weekday and saturday specs", () => {
    const specs = storeOpeningHoursJsonLd();
    expect(specs).toHaveLength(2);
    expect(specs[0].dayOfWeek).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]);
    expect(specs[0].opens).toBe("00:00");
    expect(specs[0].closes).toBe("18:00");
    expect(specs[1].dayOfWeek).toBe("Saturday");
    expect(specs[1].closes).toBe("16:00");
  });

  it("weekday pickup fallback uses 00:00 open", () => {
    expect(storeWeekdayPickupHours().opens).toBe("00:00");
    expect(storeWeekdayPickupHours().closes).toBe("18:00");
  });
});
