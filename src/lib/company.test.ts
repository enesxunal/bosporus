import { describe, expect, it } from "vitest";
import {
  STORE_OPENING_HOURS,
  storeOpeningHoursJsonLd,
  storeOpeningHoursLineDe,
  storeWeekdayPickupHours,
} from "./company";

describe("store opening hours", () => {
  it("monday-saturday hours 08:00–18:00", () => {
    for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const) {
      expect(STORE_OPENING_HOURS[day]).toEqual({ opens: "08:00", closes: "18:00" });
    }
  });

  it("sunday closed", () => {
    expect(STORE_OPENING_HOURS.sunday).toBeNull();
  });

  it("display line mentions correct hours", () => {
    const line = storeOpeningHoursLineDe();
    expect(line).toContain("08:00–18:00");
    expect(line).toContain("geschlossen");
    expect(line).not.toContain("00:00");
  });

  it("JSON-LD has monday-saturday schedule", () => {
    const specs = storeOpeningHoursJsonLd();
    expect(specs).toHaveLength(1);
    expect(specs[0].dayOfWeek).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
    expect(specs[0].opens).toBe("08:00");
    expect(specs[0].closes).toBe("18:00");
  });

  it("weekday pickup fallback uses 08:00 open", () => {
    expect(storeWeekdayPickupHours().opens).toBe("08:00");
    expect(storeWeekdayPickupHours().closes).toBe("18:00");
  });
});
