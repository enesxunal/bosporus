import { describe, it, expect } from "vitest";
import { parseBulkOrderText } from "./bulk-order-import";

describe("Excel/CSV bulk order import", () => {
  it("parses pasted TSV and adds duplicate SKU quantities", () => {
    const result = parseBulkOrderText("SKU\tMenge\ntiger-chips-paprika-90gr\t2\nMILRAM-GOUDA-48-15KG\t3\ntiger-chips-paprika-90gr\t5");
    expect(result.errors).toEqual([]);
    expect(result.items).toEqual([
      { sku: "tiger-chips-paprika-90gr", quantity: 7 },
      { sku: "milram-gouda-48-15kg", quantity: 3 },
    ]);
  });
  it("accepts semicolon and comma CSV", () => {
    expect(parseBulkOrderText("SKU;Menge\nabc-1;4").items[0]).toEqual({ sku: "abc-1", quantity: 4 });
    expect(parseBulkOrderText("abc-2,8").items[0]).toEqual({ sku: "abc-2", quantity: 8 });
  });
  it("rejects malformed, fractional, zero and oversized quantities", () => {
    for (const text of ["a", "abc;-1", "abc;0", "abc;1.5", "abc;1000", "a b;2"]) {
      expect(parseBulkOrderText(text).errors.length).toBeGreaterThan(0);
    }
    expect(parseBulkOrderText("abc;999\nabc;1").errors.length).toBeGreaterThan(0);
  });
  it("bounds list size and excludes untrusted fields", () => {
    const text = Array.from({ length: 102 }, (_, i) => `sku-${i};1`).join("\n");
    expect(parseBulkOrderText(text, 100).errors).toEqual(["Maximal 100 unterschiedliche Artikel."]);
    expect(parseBulkOrderText("SKU\tMenge\nabc;2;HACK").errors).not.toEqual([]);
  });
});
