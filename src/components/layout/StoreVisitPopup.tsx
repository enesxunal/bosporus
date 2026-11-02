"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Clock3, MapPin, ShoppingBasket, Store, Truck, X } from "lucide-react";
import { COMPANY, companyAddressLine, storeOpeningHoursLine } from "@/lib/company";
import { COOKIE_CONSENT_KEY } from "@/components/layout/CookieConsent";

const KEY = "bosporus-store-visit-popup-last-shown-v1";
export const STORE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=BOSPORUS+Handelsgesellschaft+mbH%2C+Von-H%C3%BCnefeld-Str.+2%2C+50829+K%C3%B6ln";
const DAY = 24 * 60 * 60 * 1000;

export function StoreVisitPopup() {
  const locale = useLocale();
  const tr = locale === "tr";
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const check = useCallback(() => {
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted") return;
      const last = Number(localStorage.getItem(KEY) || 0);
      if (last > 0 && Date.now() - last < DAY && Date.now() >= last) return;
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Storage disabled: show once this mount, without trapping the visitor.
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    check();
    window.addEventListener("bosporus-cookie-accepted", check);
    return () => window.removeEventListener("bosporus-cookie-accepted", check);
  }, [check]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const dialog = document.getElementById("bosporus-store-visit-popup");
        const controls = dialog?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5" role="presentation">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" onClick={() => setOpen(false)} aria-hidden="true" />
      <section id="bosporus-store-visit-popup" role="dialog" aria-modal="true" aria-labelledby="store-visit-heading" aria-describedby="store-visit-desc" className="relative w-full max-w-xl max-h-[min(92dvh,760px)] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1d71b8] to-[#07375e] px-6 py-7 sm:px-9 sm:py-9 text-white">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[30px] border-white/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Store size={26} /></span><span className="text-sm font-extrabold uppercase tracking-widest">BOSPORUS<br/><span className="text-[10px] font-semibold tracking-normal">Markt &amp; Großhandel</span></span></div>
            <button ref={closeRef} onClick={() => setOpen(false)} aria-label={tr ? "Pencereyi kapat" : "Hinweis schließen"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={22} /></button>
          </div>
          <p className="relative mt-5 inline-block rounded-full bg-[#ffd449] px-3 py-1 text-xs font-extrabold uppercase text-[#123d62]">{tr ? "Sadece online değil!" : "Nicht nur online!"}</p>
          <h2 id="store-visit-heading" className="relative mt-3 text-2xl sm:text-3xl font-extrabold leading-tight">{tr ? "Mağazamıza da bekleriz!" : "Besuchen Sie uns direkt vor Ort!"}</h2>
          <p id="store-visit-desc" className="relative mt-3 text-sm sm:text-base leading-relaxed text-white/90">{tr ? "İster bireysel alışveriş ister işletmeniz için toptan alım: Köln-Ossendorf mağazamıza gelin, ürünleri yerinde keşfedin ve mağazaya özel güncel fırsatları sorun." : "Ob für den privaten Einkauf oder den Bedarf Ihres Unternehmens: Besuchen Sie unseren Markt in Köln-Ossendorf. Entdecken Sie unser Sortiment und fragen Sie nach aktuellen Angeboten und Preisen vor Ort."}</p>
        </div>
        <div className="px-6 py-6 sm:px-9 sm:py-7">
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-slate-800">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3"><ShoppingBasket className="shrink-0 text-[#1d71b8]" size={20}/>{tr ? "Bireysel alışveriş" : "Privatkunden"}</div>
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3"><Truck className="shrink-0 text-[#1d71b8]" size={20}/>{tr ? "Toptan / B2B" : "Gewerbe & B2B"}</div>
          </div>
          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <div className="flex items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-[#1d71b8]"/><span>{companyAddressLine()}</span></div>
            <div className="flex items-start gap-2"><Clock3 size={18} className="mt-0.5 shrink-0 text-[#1d71b8]"/><span>{storeOpeningHoursLine(locale)}</span></div>
          </div>
          <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd449] px-4 py-3 text-center font-extrabold text-[#123d62] transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><MapPin size={19}/>{tr ? "Google Maps ile yol tarifi al" : "Route mit Google Maps planen"}</a>
          <button onClick={() => setOpen(false)} className="mt-3 w-full min-h-10 text-sm font-semibold text-slate-500 hover:text-slate-800">{tr ? "Alışverişe devam et" : "Weiter zur Website"}</button>
          <p className="mt-2 text-center text-xs text-slate-400">{tr ? "Online sipariş onaylı ticari müşteriler içindir." : "Online-Bestellungen sind freigeschalteten Gewerbekunden vorbehalten."}</p>
        </div>
      </section>
    </div>
  );
}
