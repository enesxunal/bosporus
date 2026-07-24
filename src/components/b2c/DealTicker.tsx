"use client";

import { useLocale } from "next-intl";

const DEALS_DE = [
  "Gewerbe: Nettopreise nach Freigabe",
  "Mindestbestellwert 500 € – erste Lieferung gratis",
  "Lieferung Köln & Umgebung – täglich frisch",
  "Abholmarkt Köln Ossendorf – Mo.–Sa. 00–18 Uhr",
];

const DEALS_TR = [
  "Toptancı: onay sonrası net fiyat",
  "Min. sipariş 500 € – ilk getirme ücretsiz",
  "Köln ve çevreye teslimat – her gün taze",
  "Köln Ossendorf Gel-Al – Pzt.–Cmt. 00–18",
];

export function DealTicker({ hasPromos = false }: { hasPromos?: boolean }) {
  const locale = useLocale();
  const base = locale === "tr" ? DEALS_TR : DEALS_DE;
  const deals =
    hasPromos
      ? [
          base[0],
          locale === "tr" ? "Bu haftanın kampanya ürünleri – ana sayfada" : "Wochenangebote – jetzt auf der Startseite",
          ...base.slice(1),
        ]
      : base;
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
