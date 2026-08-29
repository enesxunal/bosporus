import type { Locale } from "@/lib/types";

/** Resmi şirket bilgileri – Impressum, fatura, e-posta */
export const COMPANY = {
  legalName: "BOSPORUS Handelsgesellschaft mbH",
  tradeName: "Bosporus",
  street: "Von-Hünefeld-Str. 2",
  city: "Köln",
  zip: "50829",
  country: "Deutschland",
  countryEn: "Germany",
  phone: "+49 221 34098290",
  /** Yüzen WhatsApp butonu / wa.me */
  whatsappPhone: "+49 152 54381085",
  email: "info@bosporus-gmbh.com",
  website: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.bosporus-gmbh.com",
  taxNumber: "217/5713/2173",
  vatId: "DE317695485",
  registerCourt: "Amtsgericht Köln",
  registerNumber: "HRB 93064",
} as const;

export type StoreDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type StoreDayHours = { opens: string; closes: string };

/** Physische Standort-Öffnungszeiten – einzige Quelle */
export const STORE_OPENING_HOURS: Record<StoreDayKey, StoreDayHours | null> = {
  monday: { opens: "00:00", closes: "18:00" },
  tuesday: { opens: "00:00", closes: "18:00" },
  wednesday: { opens: "00:00", closes: "18:00" },
  thursday: { opens: "00:00", closes: "18:00" },
  friday: { opens: "00:00", closes: "18:00" },
  saturday: { opens: "00:00", closes: "16:00" },
  sunday: null,
};

const SCHEMA_DAY: Record<StoreDayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** schema.org OpeningHoursSpecification (Mo–Fr, Sa; So. geschlossen) */
export function storeOpeningHoursJsonLd() {
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: STORE_OPENING_HOURS.monday!.opens,
      closes: STORE_OPENING_HOURS.monday!.closes,
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: STORE_OPENING_HOURS.saturday!.opens,
      closes: STORE_OPENING_HOURS.saturday!.closes,
    },
  ];
}

export function storeOpeningHoursLineDe(): string {
  return "Mo.–Fr.: 00:00–18:00 Uhr, Sa.: 00:00–16:00 Uhr, So.: geschlossen";
}

export function storeOpeningHoursLineTr(): string {
  return "Pzt.–Cum.: 00:00–18:00, Cmt.: 00:00–16:00, Paz.: kapalı";
}

export function storeOpeningHoursLineEn(): string {
  return "Mon–Fri: 00:00–18:00, Sat: 00:00–16:00, Sun: closed";
}

export function storeOpeningHoursLine(locale: Locale | string): string {
  return locale === "tr" ? storeOpeningHoursLineTr() : storeOpeningHoursLineDe();
}

/** Pickup slot fallback — Mo–Fr 00:00–18:00 */
export function storeWeekdayPickupHours(): StoreDayHours {
  return STORE_OPENING_HOURS.monday!;
}

/** JS Date.getDay() → StoreDayKey (0=Sunday) */
export function storeDayKeyFromJsDay(jsDay: number): StoreDayKey {
  const keys: StoreDayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return keys[jsDay] ?? "monday";
}

export function storeHoursForDay(key: StoreDayKey): StoreDayHours | null {
  return STORE_OPENING_HOURS[key];
}

export function companyAddressLine(): string {
  return `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;
}

export function companyAddressBlock(): string {
  return `${COMPANY.legalName}\n${COMPANY.street}\n${COMPANY.zip} ${COMPANY.city}\n${COMPANY.country}`;
}
