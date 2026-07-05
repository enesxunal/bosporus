"use client";

import { useTranslations, useLocale } from "next-intl";

const DEALS_DE = [
  "🔥 Wochenangebote – bis zu -30% auf Getränke",
  "❄️ Tiefkühl-Aktion diese Woche",
  "🍕 Italienische Küche – Sonderpreise für Gastronomie",
  "📍 Abholmarkt Köln Ossendorf – Mo.–Sa. 00–18 Uhr",
];

const DEALS_TR = [
  "🔥 Haftalık fırsatlar – içeceklerde %30'a varan indirim",
  "❄️ Bu hafta donmuş ürün kampanyası",
  "🍕 İtalyan mutfağı – gastronomi özel fiyatları",
  "📍 Köln Ossendorf Gel-Al – Pzt.–Cmt. 00–18",
];

export function DealTicker() {
  const locale = useLocale();
  const deals = locale === "tr" ? DEALS_TR : DEALS_DE;
  const items = [...deals, ...deals];

  return (
    <div className="bg-bosporus-yellow text-bosporus-gray-800 overflow-hidden border-b border-bosporus-yellow-dark">
      <div className="flex animate-marquee whitespace-nowrap py-2 text-sm font-semibold">
        {items.map((deal, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-2">
            {deal}
            <span className="text-bosporus-blue">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
