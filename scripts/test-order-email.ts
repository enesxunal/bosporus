import { readFileSync } from "fs";
import { notifyOrderPlaced } from "../src/lib/order-notifications";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  let v = t.slice(i + 1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[t.slice(0, i)] = v.trim();
}

async function main() {
  await notifyOrderPlaced({
  customerEmail: "info@bosporus-gmbh.com",
  customerName: "Test Musteri",
  orderNumber: "BOS-TEST-001",
  orderType: "click_collect",
  totalGross: 99.5,
  items: [
    {
      productId: "x",
      sku: "TEST",
      name: "Test Urun",
      quantity: 2,
      unit: "piece",
      priceNet: 10,
      priceGross: 11.9,
      taxRate: 19,
    },
  ],
  locale: "tr",
  pickupDate: "2026-07-07",
  pickupSlot: "10:00",
  });

  console.log("✅ Sipariş mailleri gönderildi (müşteri + admin)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
