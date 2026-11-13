/**
 * Curated facts for high-intent Bosporus product pages.
 * Sources: the actual product names/SKUs in the catalog and the approved
 * category guides. NO unverified claims about ingredients, origin, expiry,
 * certification, nutrition or current stock.
 */
export type ProductContent = {
  description: string;
  detail: string;
};

export const VERIFIED_PRODUCT_CONTENT: Record<string, ProductContent> = {
  "milram-gouda-48-15kg": {
    description: "Milram Gouda 48 % im 15-kg-Gebinde bei Bosporus Köln. Verpackungsgröße, aktuellen Preis und Bestellung für gewerbliche Kunden prüfen.",
    detail: "Der Katalogartikel Milram Gouda 48 % ist mit 15 kg bezeichnet. Bei der Kalkulation für Großküchen und Gastronomie sind die tatsächliche Verkaufseinheit und der geplante Verbrauch entscheidend. Aktuelle Konditionen und Verfügbarkeit gelten gemäß Produktanzeige; zu Kühlung und Haltbarkeit ist die Verpackungskennzeichnung maßgeblich.",
  },
  "milram-raspel-gouda-mozzarella-mix-2kg": {
    description: "Milram Raspel Gouda-Mozzarella-Mix im 2-kg-Gebinde. Käsemischung für den Gastroeinkauf bei Bosporus Köln.",
    detail: "Dieser Artikel heißt Milram Raspel Gouda-Mozzarella-Mix und wird als 2-kg-Gebinde geführt. Vergleichen Sie bei der Bestellung die Rezeptanforderungen und die Verpackungsgröße mit anderen Käseartikeln. Zusammensetzung und Lagerbedingungen bitte direkt dem Etikett entnehmen.",
  },
  "milram-schlagsahne-30-5kg": {
    description: "Milram Schlagsahne 30 % als 5-kg-Artikel im Bosporus Großhandel Köln. Molkereigebinde für gewerbliche Kunden vergleichen.",
    detail: "Die Katalogbezeichnung weist Milram Schlagsahne mit 30 % und 5 kg aus. Für eine gewerbliche Einkaufsplanung empfiehlt es sich, die benötigte Menge und Kühlkapazität vorab abzustimmen. Verbindliche Angaben zur Lagerung und Haltbarkeit stehen auf der Produktverpackung.",
  },
  "korfez-joghurt-3-8-5kg": {
    description: "Körfez Joghurt 3,8 % im 5-kg-Gebinde bei Bosporus Köln. Produktmenge und aktuelle Gewerbekonditionen im Katalog prüfen.",
    detail: "Körfez Joghurt ist hier als 3,8-%-Variante im 5-kg-Gebinde bezeichnet. Diese Angabe bezieht sich auf den gelisteten Artikel; bei der Bestellung sind die tatsächliche Verpackung und Kühlbedingungen zu beachten. Aktuelle Preise entnehmen freigeschaltete Gewerbekunden dem Shop.",
  },
  "real-american-chicken-nuggets-halal-1kg-halal": {
    description: "Real American Chicken Nuggets Halal 1 kg bei Bosporus Köln. Tiefkühlartikel für Imbiss und Gastronomie mit Hinweisen zur Produktprüfung.",
    detail: "Der Katalog nennt diese Variante Real American Chicken Nuggets Halal 1 kg. Die Halal-Angabe stammt aus der Artikelbezeichnung; wenn Sie einen Zertifikatsnachweis benötigen, sollten Sie das konkrete Herstelleretikett und die zugehörigen Unterlagen prüfen. Auch Zubereitung und Allergene können nur anhand der Produktkennzeichnung verbindlich beurteilt werden.",
  },
  "chicken-nuggets-im-backteig-halal-1kg": {
    description: "Chicken Nuggets im Backteig Halal 1 kg bei Bosporus Großhandel Köln. Tiefkühlgebinde und Produktangaben für die Gastronomie.",
    detail: "Dieser Artikel ist als Chicken Nuggets im Backteig Halal mit 1 kg gelistet. Ein Wechsel zwischen Nuggets-Varianten kann Rezeptur und Portionsplanung verändern. Bitte beachten Sie die aktuelle Herstellerkennzeichnung zu Halal-Nachweis, Zutaten, Allergenen und Zubereitung.",
  },
  "tiger-chips-paprika-90gr": {
    description: "Tiger Chips Paprika 90 g bei Bosporus Köln. Kiosk-Snack im gelisteten Gebinde, Preis und Verfügbarkeit im Produktkatalog.",
    detail: "Tiger Chips Paprika werden hier als 90-g-Artikel geführt. Für den Kioskeinkauf empfiehlt es sich, Geschmackssorten und Verkaufseinheiten einzeln zu vergleichen. Die aktuellen Konditionen sind im Shop ausgewiesen; für Zutaten und Allergene gilt die Verpackungsangabe.",
  },
  "tiger-chips-chili-lemon-90gr": {
    description: "Tiger Chips Chili & Lemon 90 g bei Bosporus Köln. Die Chips-Variante für Kiosk und Snack-Sortiment im Katalog vergleichen.",
    detail: "Tiger Chips Chili & Lemon sind mit 90 g im Artikelnamen angegeben. Diese Sorte ist von anderen Tiger-Chips-Varianten zu unterscheiden, auch wenn die Packungsgröße gleich sein kann. Angaben zu Zutaten und möglichen Allergenen entnehmen Sie dem konkreten Produktetikett.",
  },
  "gyma-premium-salatmayonnaise-10l-eimer": {
    description: "GYMA Premium Salatmayonnaise im 10-Liter-Eimer. Großgebinde für Gastronomie und Imbiss bei Bosporus Köln.",
    detail: "Die Katalogbezeichnung lautet GYMA Premium Salatmayonnaise 10 l Eimer. Für die Kalkulation eines Großgebindes ist die tatsächlich verbrauchte Menge pro Portion wichtig. Die Begriffe Salatmayonnaise und Mayonnaise sind nicht automatisch austauschbar; prüfen Sie das Zutatenverzeichnis.",
  },
  "gyma-eco-tomatenketchup-10kg-eimer": {
    description: "GYMA Eco Tomatenketchup im 10-kg-Eimer bei Bosporus Köln. Saucen-Großgebinde für gewerbliche Bestellungen.",
    detail: "GYMA Eco Tomatenketchup wird als 10-kg-Eimer geführt. Beachten Sie bei Vergleichen mit Portionsware, dass eine Kilogrammangabe nicht mit einer Literangabe gleichgesetzt werden darf. Die konkrete Zusammensetzung und Lagerhinweise stehen auf der Verpackung.",
  },
  "gyma-tomatenketchup-150x15g-portionsbeutel": {
    description: "GYMA Tomatenketchup in 150 Portionsbeuteln à 15 g. Gastro-Portionspackung bei Bosporus Köln online finden.",
    detail: "Im Artikelnamen sind 150 Portionsbeutel zu je 15 g genannt. Für die Auswahl gegenüber Eimerware zählen Portionsbedarf, Ausgabesituation und Verpackungsaufwand. Alle verbindlichen Zutaten- und Allergenangaben sind der Herstellerverpackung zu entnehmen.",
  },
  "d-p-pizzabox-b-w-vollfarbe-30x30x4cm-100st": {
    description: "D.P. Pizzabox B&W Vollfarbe, 30 × 30 × 4 cm, 100 Stück. Pizzakartons für Gastronomie bei Bosporus Köln.",
    detail: "Die Katalogbezeichnung gibt 30 × 30 × 4 cm und 100 Stück an. Prüfen Sie die erforderlichen Maße vor der Bestellung, da Pizzakartons verschiedener Größen nicht beliebig austauschbar sind. Eignung und genaue Materialdetails sollten anhand der Herstellerangaben bewertet werden.",
  },
  "pizzakarton-30x30x4-braun-100stk": {
    description: "Brauner Pizzakarton 30 × 30 × 4 cm im 100er-Gebinde. Gastro-Verpackung bei Bosporus Köln bestellen.",
    detail: "Dieser braune Pizzakarton ist im Artikelnamen mit 30 × 30 × 4 und 100 Stück ausgewiesen. Vergleichen Sie beim Einkauf die Maße und Verpackungseinheit mit Ihrem tatsächlichen Bedarf. Zusätzliche Eigenschaften des Materials sind nur anhand des jeweiligen Artikeldatenblatts belastbar.",
  },
  "d-p-saucenbecher-mit-deckel-50cc-transparant-pet-20x50": {
    description: "D.P. transparenter PET-Saucenbecher mit Deckel, 50 cc, 20 × 50. Gastronomie-Verpackungen im Bosporus Katalog.",
    detail: "Der Artikel wird als transparenter PET-Saucenbecher mit Deckel, 50 cc, 20 × 50 geführt. Vor dem Einsatz prüfen Sie bitte die genaue Füllmenge, die Deckelkompatibilität und die vom Hersteller freigegebenen Verwendungsbedingungen. Eine Eignung für heiße Lebensmittel wird ohne Produktnachweis nicht zugesichert.",
  },
};

export function getVerifiedProductContent(sku: string): ProductContent | null {
  return VERIFIED_PRODUCT_CONTENT[sku] ?? null;
}
