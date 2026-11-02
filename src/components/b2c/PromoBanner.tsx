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
    image: "/home/home-banner-giris-20261102.jpg",
    titleDe: "Ihr Markt in Köln-Ossendorf",
    titleTr: "Köln-Ossendorf'taki marketiniz",
    subtitleDe: "Einkaufen vor Ort – für Privatkunden und Gewerbe. Aktuelle Angebote direkt im Markt entdecken.",
    subtitleTr: "Bireysel ve ticari müşteriler mağazamızdan alışveriş yapabilir. Güncel fırsatları yerinde keşfedin.",
    ctaDe: "Anfahrt mit Google Maps",
    ctaTr: "Google Maps'te yol tarifi",
    href: "https://www.google.com/maps/search/?api=1&query=BOSPORUS+Handelsgesellschaft+mbH%2C+Von-H%C3%BCnefeld-Str.+2%2C+50829+K%C3%B6ln",
  },
  {
    image: "/home/home-banner-frische.jpg",
    titleDe: "Frische & Vielfalt vor Ort",
    titleTr: "Tazelik ve çeşitlilik mağazada",
    subtitleDe: "Lebensmittel, Obst, Gemüse, Getränke und mehr – besuchen Sie unseren Markt in Köln.",
    subtitleTr: "Gıda, meyve, sebze, içecek ve daha fazlası için Köln'deki mağazamıza bekleriz.",
    ctaDe: "Sortiment entdecken",
    ctaTr: "Ürünleri keşfet",
    href: "/products",
  },
  {
    image: "/home/home-banner-grill.jpg",
    titleDe: "Großhandel für Gastronomie & Handel",
    titleTr: "Gastronomi ve işletmelere toptan satış",
    subtitleDe: "Für Restaurants, Imbisse, Kioske und Wiederverkäufer. Online-Bestellungen nach Gewerbe-Freigabe.",
    subtitleTr: "Restoran, büfe ve işletmelere toptan satış. Online sipariş için ticari hesap onayı gerekir.",
    ctaDe: "Gewerbekonto eröffnen",
    ctaTr: "Ticari hesap aç",
    href: "/register",
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
      <div className="relative h-[260px] sm:h-[300px] md:h-[380px]">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-hidden={i !== current}
          >
            {(i === current || i === (current + 1) % SLIDES.length) && (
              <Image
                src={s.image}
                alt=""
                fill
                className="object-cover"
                priority={i === 0 && current === 0}
                sizes="100vw"
                quality={75}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          </div>
        ))}
        <div className="relative z-10 page-container h-full flex flex-col justify-center pb-10 sm:pb-0">
          <div className="max-w-lg pr-2 sm:pr-0">
            <span className="inline-block w-fit px-3 py-1 bg-bosporus-yellow text-bosporus-gray-800 text-[10px] sm:text-xs font-bold uppercase mb-2 sm:mb-3 rounded-lg">
              {locale === "de" ? "Vor Ort & Online für Gewerbe" : "Mağaza ve ticari online satış"}
            </span>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight tracking-tight">
              {title}
            </h2>
            <p className="text-white/85 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-none">
              {subtitle}
            </p>
            <Link href={slide.href} target={slide.href.startsWith("http") ? "_blank" : undefined} rel={slide.href.startsWith("http") ? "noopener noreferrer" : undefined}>
              <Button variant="secondary" size="lg" className="!bg-white !text-bosporus-gray-800 hover:!bg-bosporus-yellow w-fit text-sm sm:text-base">
                {cta} →
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
        className="hidden sm:flex absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 touch-target items-center justify-center bg-white/90 rounded-xl hover:bg-white shadow-lg active:scale-95 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
        className="hidden sm:flex absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 touch-target items-center justify-center bg-white/90 rounded-xl hover:bg-white shadow-lg active:scale-95 transition-all"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
          className="sm:hidden flex items-center justify-center w-8 h-8 bg-white/90 rounded-lg shadow active:scale-95"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
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
        <button
          type="button"
          onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
          className="sm:hidden flex items-center justify-center w-8 h-8 bg-white/90 rounded-lg shadow active:scale-95"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
