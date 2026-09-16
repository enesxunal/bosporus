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
  monday: { opens: "08:00", closes: "18:00" },
  tuesday: { opens: "08:00", closes: "18:00" },
  wednesday: { opens: "08:00", closes: "18:00" },
  thursday: { opens: "08:00", closes: "18:00" },
  friday: { opens: "08:00", closes: "18:00" },
  saturday: { opens: "08:00", closes: "18:00" },
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

/** schema.org OpeningHoursSpecification (Mo–Sa; So. geschlossen) */
export function storeOpeningHoursJsonLd() {
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: STORE_OPENING_HOURS.monday!.opens,
      closes: STORE_OPENING_HOURS.monday!.closes,
    },
  ];
}

export function storeOpeningHoursLineDe(): string {
  return "Mo.–Sa.: 08:00–18:00 Uhr, So.: geschlossen";
}

export function storeOpeningHoursLineTr(): string {
  return "Pzt.–Cmt.: 08:00–18:00, Paz.: kapalı";
}

export function storeOpeningHoursLineEn(): string {
  return "Mon–Sat: 08:00–18:00, Sun: closed";
}

export function storeOpeningHoursLine(locale: Locale | string): string {
  return locale === "tr" ? storeOpeningHoursLineTr() : storeOpeningHoursLineDe();
}

/** Pickup slot fallback — Mo–Sa 08:00–18:00 */
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
