"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=480&fit=crop",
    titleDe: "Frische vom Großmarkt",
    titleTr: "Haldan taze ürünler",
    subtitleDe: "Obst, Gemüse & mehr – täglich frisch in Köln",
    subtitleTr: "Meyve, sebze ve daha fazlası – Köln'de her gün taze",
    ctaDe: "Jetzt entdecken",
    ctaTr: "Keşfet",
    href: "/products/gemuese",
  },
  {
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=480&fit=crop",
    titleDe: "Für Ihre Gastronomie",
    titleTr: "Gastronominiz için",
    subtitleDe: "Großhandelspreise – Netto für Gewerbekunden",
    subtitleTr: "Toptan fiyatlar – kurumsal müşterilere net",
    ctaDe: "Gewerbe-Portal",
    ctaTr: "Kurumsal Portal",
    href: "/gewerbe",
  },
  {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=480&fit=crop",
    titleDe: "Grill-Saison ist da",
    titleTr: "Mangal sezonu başladı",
    subtitleDe: "Fleisch, Kohle & Zubehör – alles aus einer Hand",
    subtitleTr: "Et, kömür ve aksesuar – tek adreste",
    ctaDe: "Zum Sortiment",
    ctaTr: "Ürünlere git",
    href: "/products/grillkohle",
  },
];

export function PromoBanner() {
  const locale = useLocale();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];
  const title = locale === "tr" ? slide.titleTr : slide.titleDe;
  const subtitle = locale === "tr" ? slide.subtitleTr : slide.subtitleDe;
  const cta = locale === "tr" ? slide.ctaTr : slide.ctaDe;

  return (
    <section className="relative w-full overflow-hidden bg-bosporus-gray-800">
      <div className="relative h-[240px] sm:h-[300px] md:h-[380px]">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0"
            )}
          >
            <Image src={s.image} alt="" fill className="object-cover" priority={i === 0} sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          </div>
        ))}
        <div className="relative z-10 page-container h-full flex flex-col justify-center">
          <span className="inline-block w-fit px-3 py-1 bg-bosporus-yellow text-bosporus-gray-800 text-[10px] sm:text-xs font-bold uppercase mb-3 rounded-lg">
            {locale === "de" ? "Top-Angebot" : "Fırsat"}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-2 sm:mb-3 max-w-lg leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-white/85 text-sm sm:text-base md:text-lg mb-5 sm:mb-6 max-w-md">{subtitle}</p>
          <Link href={slide.href}>
            <Button variant="secondary" size="lg" className="!bg-white !text-bosporus-gray-800 hover:!bg-bosporus-yellow w-fit">
              {cta} →
            </Button>
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 touch-target flex items-center justify-center bg-white/90 rounded-xl hover:bg-white shadow-lg active:scale-95 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 touch-target flex items-center justify-center bg-white/90 rounded-xl hover:bg-white shadow-lg active:scale-95 transition-all"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === current ? "w-6 bg-bosporus-yellow" : "w-2 bg-white/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
