import { Link } from "@/i18n/navigation";
import { MapPin, Phone, Clock, Car, MessageCircle } from "lucide-react";
import { COMPANY, companyAddressLine } from "@/lib/company";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Von-H%C3%BCnefeld-Str.+2,+50829+K%C3%B6ln";

const CATEGORIES = [
  { slug: "lebensmittel", label: "Lebensmittel" },
  { slug: "getraenke", label: "Getränke" },
  { slug: "tk-tiefkuehl", label: "Tiefkühlprodukte" },
  { slug: "gewuerze", label: "Gewürze" },
  { slug: "saucen", label: "Saucen" },
  { slug: "snacks-suesswaren", label: "Snacks" },
  { slug: "verpackung-reinigungsmittel-hygiene", label: "Verpackung & Hygiene" },
  { slug: "asia", label: "Internationale Lebensmittel" },
] as const;

export function LocalSeoSection() {
  const whatsappHref = `https://wa.me/${COMPANY.whatsappPhone.replace(/\D/g, "")}`;

  return (
    <section className="py-10 sm:py-14 bg-bosporus-light/40 border-y border-bosporus/10">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-bosporus-gray-800 mb-3">
              Bosporus Großhandel in Köln-Ossendorf
            </h2>
            <p className="text-bosporus-muted leading-relaxed mb-4">
              Bosporus GmbH ist ein Lebensmittel- und Getränke-Großhandel mit Standort in Köln-Ossendorf.
              Unser Online-Shop richtet sich an Gewerbekunden. Vor Ort in Köln-Ossendorf können auch
              Privatkunden einkaufen.
            </p>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-bosporus-gray-800">{COMPANY.legalName}</p>
                  <a
                    href={MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bosporus hover:underline"
                  >
                    {companyAddressLine()}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-bosporus shrink-0" />
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="text-bosporus hover:underline font-medium">
                  {COMPANY.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-bosporus shrink-0" />
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-bosporus hover:underline font-medium">
                  WhatsApp {COMPANY.whatsappPhone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-bosporus shrink-0" />
                <span className="text-bosporus-gray-800">
                  Mo.–Sa. {COMPANY.openingHours.open}–{COMPANY.openingHours.close} Uhr
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-bosporus shrink-0 mt-0.5" />
                <span className="text-bosporus-gray-800">Parkplätze stehen direkt vor Ort zur Verfügung.</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-bosporus-gray-800 mb-3">Sortiment & Kunden</h3>
            <ul className="grid grid-cols-2 gap-2 mb-6">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/products/${cat.slug}`}
                    className="text-sm text-bosporus hover:underline font-medium"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-white border border-bosporus/15 p-4 space-y-2 text-sm">
              <p>
                <span className="font-semibold text-bosporus-gray-800">Gewerbekunden:</span>{" "}
                Online bestellen, Abholung oder Lieferung nach Freigabe.
              </p>
              <p>
                <span className="font-semibold text-bosporus-gray-800">Privatkunden:</span>{" "}
                Einkauf direkt vor Ort möglich.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-10 items-center px-4 text-sm font-bold rounded-xl bg-bosporus text-white hover:bg-bosporus-dark transition-colors"
              >
                Kontakt & Anfahrt
              </Link>
              <Link
                href="/ratgeber"
                className="inline-flex h-10 items-center px-4 text-sm font-bold rounded-xl border-2 border-bosporus/25 text-bosporus-gray-800 hover:bg-white transition-colors"
              >
                Ratgeber
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
