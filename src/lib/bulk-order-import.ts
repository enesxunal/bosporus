/** Convert pasted Excel cells (TSV) or a two-column CSV into a safe SKU/quantity plan.
 * No prices, payment data, or personal information are imported. */
export type BulkOrderLine = { sku: string; quantity: number };
export type BulkOrderParse = { items: BulkOrderLine[]; errors: string[] };

export function parseBulkOrderText(raw: string, maxItems = 100): BulkOrderParse {
  const items = new Map<string, BulkOrderLine>();
  const errors: string[] = [];
  if (raw.length > 24_000) return { items: [], errors: ["Die Liste ist zu lang (max. 24 KB)."] };
  const rows = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const value = rows[i].trim();
    if (!value) continue;
    // Excel paste is tab-separated, other programs often export SKU;Menge.
    const fields = value.split(/\t|;|,/).map((s) => s.trim().replace(/^"|"$/g, "").trim());
    if (i === 0 && /^(sku|art(?:ikel)?[- ]?nr|artikelnummer|product\s*id)$/i.test(fields[0] ?? "")) {
      continue;
    }
    if (fields.length !== 2 || !/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(fields[0])) {
      errors.push(`Zeile ${i + 1}: SKU und Menge erforderlich.`);
      continue;
    }
    const number = Number(fields[1]);
    if (!Number.isInteger(number) || number < 1 || number > 999) {
      errors.push(`Zeile ${i + 1}: Menge muss 1–999 sein.`);
      continue;
    }
    const sku = fields[0].toLowerCase();
    const previous = items.get(sku)?.quantity ?? 0;
    if (previous + number > 999) {
      errors.push(`Zeile ${i + 1}: Gesamtmenge über 999 (${sku}).`);
      continue;
    }
    items.set(sku, { sku, quantity: previous + number });
    if (items.size > maxItems) {
      return { items: [], errors: [`Maximal ${maxItems} unterschiedliche Artikel.`] };
    }
  }
  if (items.size === 0 && errors.length === 0) errors.push("Keine Artikel eingegeben.");
  return { items: [...items.values()], errors };
}
