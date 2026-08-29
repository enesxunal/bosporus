import type { Category } from "@/lib/types";

export type CategoryFaq = { question: string; answer: string };

export type CategorySeoContent = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: CategoryFaq[];
  relatedSlugs: string[];
};

/** Kategori slug → unique SEO landing content (Almanca, DE pazar) */
const CATEGORY_SEO: Record<string, CategorySeoContent> = {
  lebensmittel: {
    title: "Lebensmittel Großhandel Köln für Gastronomie & Handel",
    description:
      "Lebensmittel Großhandel in Köln-Ossendorf: Sortiment für Restaurants, Imbisse, Kioske und Wiederverkäufer. Online-Shop für Gewerbekunden, Einkauf vor Ort auch für Privatkunden.",
    h1: "Lebensmittel Großhandel für Gastronomie in Köln",
    intro:
      "Bei Bosporus GmbH in Köln-Ossendorf finden Gastronomie, Imbiss, Kiosk und Einzelhandel ein breites Lebensmittelsortiment – von Grundnahrungsmitteln bis zu Spezialitäten. Unser Online-Shop richtet sich an Gewerbekunden; vor Ort können auch Privatkunden einkaufen.",
    sections: [
      {
        heading: "Sortiment für Gastronomie und Handel",
        body: "In der Kategorie Lebensmittel finden Sie Artikel für den täglichen Bedarf in Küche, Theke und Regal: Nudeln, Reis, Mehl, Öle, Konserven, Tiefkühlprodukte und vieles mehr. Bosporus beliefert Betriebe in Köln und der Region – mit Abholung am Standort Von-Hünefeld-Str. 2 oder Lieferung für freigeschaltete Gewerbekunden.",
      },
      {
        heading: "Für wen eignet sich der Bosporus Lebensmittel-Großhandel?",
        body: "Restaurants, Dönerläden, Imbisse, Kioske, Cafés, Caterer und Wiederverkäufer profitieren von übersichtlichen Kategorien und Mengenpreisen nach Gewerbe-Freigabe. Parkplätze stehen direkt vor Ort zur Verfügung.",
      },
    ],
    faq: [
      {
        question: "Kann ich als Privatkunde Lebensmittel bei Bosporus kaufen?",
        answer:
          "Ja, am Standort in Köln-Ossendorf. Der Online-Shop und Checkout sind ausschließlich für freigeschaltete Gewerbekunden.",
      },
      {
        question: "Gibt es Lieferung für Lebensmittel?",
        answer:
          "Ja, für freigeschaltete Gewerbekunden mit Mindestbestellwert. Details unter Liefergebiet.",
      },
    ],
    relatedSlugs: ["getraenke", "tk-tiefkuehl", "gewuerze", "saucen"],
  },
  getraenke: {
    title: "Getränke Großhandel Köln für Gastronomie",
    description:
      "Getränke Großhandel in Köln: Wasser, Softdrinks, Ayran, Energy Drinks und mehr für Restaurant, Kiosk und Imbiss. Gewerbe online, Privatkunden vor Ort.",
    h1: "Getränke Großhandel für Gastronomie in Köln",
    intro:
      "Wasser, Limonaden, Ayran, Säfte und Energy Drinks für Gastronomie, Kiosk und Wiederverkauf – Bosporus GmbH in Köln-Ossendorf führt ein umfangreiches Getränkesortiment. Online bestellen können freigeschaltete Gewerbekunden; Privatkunden kaufen direkt vor Ort.",
    sections: [
      {
        heading: "Getränke für Restaurant, Kiosk und Imbiss",
        body: "Ob Erfrischungsgetränke für die Theke, Ayran für Dönerläden oder Wasser und Säfte für den Gastronomiebetrieb – in dieser Kategorie finden Sie passende Artikel in verschiedenen Gebindegrößen. Bosporus liefert an Gewerbekunden in Köln und Umgebung.",
      },
      {
        heading: "Ayran, Softdrinks und mehr",
        body: "Neben klassischen Marken führen wir auch Ayran-Sorten wie Ayfit Ayran 250 ml – beliebt in Gastronomie und Lebensmittelhandel. Alle Preise und Bestellungen online nur nach Gewerbe-Freigabe.",
      },
    ],
    faq: [
      {
        question: "Welche Getränke führt Bosporus für Gastronomie?",
        answer:
          "Wasser, Softdrinks, Ayran, Säfte, Energy Drinks und weiteres – siehe Sortiment in dieser Kategorie.",
      },
      {
        question: "Kann ich Getränke als Privatkunde online bestellen?",
        answer:
          "Nein. Online-Bestellung nur für Gewerbekunden. Privatkunden können am Standort in Köln-Ossendorf einkaufen.",
      },
    ],
    relatedSlugs: ["lebensmittel", "molkerei", "alkohol", "snacks-suesswaren"],
  },
  "tk-tiefkuehl": {
    title: "Tiefkühl Großhandel Köln für Gastronomie",
    description:
      "Tiefkühlprodukte Großhandel in Köln: TK-Fleisch, Pommes, Nuggets, Fertiggerichte für Restaurant und Imbiss. Bosporus GmbH Köln-Ossendorf.",
    h1: "Tiefkühl Großhandel für Gastronomie in Köln",
    intro:
      "Tiefkühlware für Gastronomie und Imbiss – von Hähnchenprodukten über Pommes bis zu Fertigportionen. Bosporus GmbH in Köln-Ossendorf beliefert Gewerbekunden; Einkauf vor Ort auch für Privatkunden möglich.",
    sections: [
      {
        heading: "TK-Sortiment für Küche und Theke",
        body: "Schnell verfügbare Tiefkühlprodukte für den professionellen Einsatz: Chicken Nuggets, Hotwings, Burger-Patties, Pommes und mehr. Ideal für Imbiss, Dönerladen und Restaurant mit hohem Durchsatz.",
      },
    ],
    faq: [
      {
        question: "Liefert Bosporus Tiefkühlware an Gastronomie?",
        answer: "Ja, an freigeschaltete Gewerbekunden in Köln und Umgebung nach den üblichen Lieferbedingungen.",
      },
    ],
    relatedSlugs: ["lebensmittel", "gemuese", "saucen"],
  },
  gewuerze: {
    title: "Gewürze Großhandel Köln für Gastronomie",
    description:
      "Gewürze und Würzmittel Großhandel in Köln für Restaurant, Imbiss und Dönerladen. Bosporus GmbH – Sortiment online für Gewerbekunden.",
    h1: "Gewürze Großhandel für Gastronomie in Köln",
    intro:
      "Gewürze, Gewürzmischungen und Würzmittel für die professionelle Küche – Bosporus in Köln-Ossendorf führt ein breites Sortiment für Gastronomie, Imbiss und Handel.",
    sections: [
      {
        heading: "Gewürze für Döner, Grill und Küche",
        body: "Von Einzelgewürzen bis zu Mischungen für Döner, Grill und Salate – passende Mengen für den Großhandelsbedarf. Online-Shop für Gewerbekunden, Abholung vor Ort für alle.",
      },
    ],
    faq: [],
    relatedSlugs: ["saucen", "lebensmittel", "asia"],
  },
  saucen: {
    title: "Saucen Großhandel Köln für Gastronomie",
    description:
      "Saucen Großhandel in Köln: Ketchup, Mayonnaise, Dönersauce und mehr für Restaurant, Imbiss und Kiosk. Bosporus GmbH Köln-Ossendorf.",
    h1: "Saucen Großhandel für Gastronomie in Köln",
    intro:
      "Saucen und Dressings für Gastronomie und Imbiss – Bosporus GmbH in Köln führt ein vielfältiges Sortiment in Großgebinden für den professionellen Einsatz.",
    sections: [
      {
        heading: "Saucen für Theke und Küche",
        body: "Ketchup, Mayonnaise, Knoblauchsauce, Dönersaucen und Spezialitäten in praktischen Gebindegrößen für hohen Verbrauch in Restaurant und Imbiss.",
      },
    ],
    faq: [],
    relatedSlugs: ["gewuerze", "lebensmittel", "tk-tiefkuehl"],
  },
  "snacks-suesswaren": {
    title: "Snacks Großhandel Köln für Kiosk & Handel",
    description:
      "Snacks und Süßwaren Großhandel in Köln: Chips, Knabbereien und Süßigkeiten für Kiosk, Imbiss und Wiederverkäufer. Bosporus GmbH.",
    h1: "Snacks & Süßwaren Großhandel in Köln",
    intro:
      "Chips, Knabbereien und Süßwaren für Kiosk, Imbiss und Einzelhandel – bei Bosporus in Köln-Ossendorf finden Gewerbekunden und Privatkunden (vor Ort) ein breites Snack-Sortiment.",
    sections: [
      {
        heading: "Chips und Knabbereien für den Wiederverkauf",
        body: "Sortimente wie Tiger Chips in verschiedenen Geschmacksrichtungen sowie weitere Snacks für Theke und Regal. Online-Bestellung für Gewerbekunden nach Freigabe.",
      },
    ],
    faq: [],
    relatedSlugs: ["getraenke", "lebensmittel", "konserven"],
  },
  "verpackung-reinigungsmittel-hygiene": {
    title: "Verpackung & Hygiene Großhandel Köln",
    description:
      "Verpackungsmaterial, Reinigungsmittel und Hygieneartikel Großhandel in Köln für Gastronomie und Handel. Bosporus GmbH Köln-Ossendorf.",
    h1: "Verpackung, Reinigung & Hygiene Großhandel in Köln",
    intro:
      "Verpackungen, Reinigungsmittel und Hygieneprodukte für Gastronomie und Gewerbe – Bosporus in Köln-Ossendorf. Darunter auch Waschmittel wie Mr Oxy für den professionellen Bedarf.",
    sections: [
      {
        heading: "Hygiene und Reinigung für Betriebe",
        body: "Vom To-go-Becher über Reinigungsmittel bis zu Hygieneartikeln – alles für den laufenden Betrieb in Gastronomie und Handel.",
      },
    ],
    faq: [],
    relatedSlugs: ["lebensmittel", "sonstiges"],
  },
  molkerei: {
    title: "Molkereiprodukte Großhandel Köln",
    description:
      "Molkereiprodukte und Ayran Großhandel in Köln für Gastronomie und Handel. Bosporus GmbH – u.a. Ayfit Ayran für Dönerladen und Imbiss.",
    h1: "Molkereiprodukte Großhandel in Köln",
    intro:
      "Milchprodukte, Ayran und Molkereiware für Gastronomie und Lebensmittelhandel – Bosporus GmbH in Köln-Ossendorf führt Sortimente wie Ayfit Ayran 250 ml und weitere Molkereiartikel.",
    sections: [
      {
        heading: "Ayran und Molkereiware für Gastronomie",
        body: "Ayran ist besonders in Dönerläden und Imbissen gefragt. In dieser Kategorie finden Sie verschiedene Marken und Gebindegrößen für den Großhandelsbedarf.",
      },
    ],
    faq: [
      {
        question: "Führt Bosporus Ayfit Ayran?",
        answer: "Ja, Ayfit Ayran 250 ml und weitere Ayran-Sorten finden Sie in dieser Kategorie.",
      },
    ],
    relatedSlugs: ["getraenke", "lebensmittel", "kuehlschrankware"],
  },
  gemuese: {
    title: "Gemüse Großhandel Köln für Gastronomie",
    description:
      "Gemüse Großhandel in Köln für Restaurant, Imbiss und Caterer. Frisches Sortiment bei Bosporus GmbH Köln-Ossendorf.",
    h1: "Gemüse Großhandel für Gastronomie in Köln",
    intro:
      "Gemüse für Gastronomie und Handel – Bosporus in Köln-Ossendorf. Ergänzend zu Tiefkühl und Konserven für den vielseitigen Küchenbedarf.",
    sections: [
      {
        heading: "Gemüse für den Gastronomiebetrieb",
        body: "Passende Gemüseartikel für Restaurant, Imbiss und Caterer – online für Gewerbekunden, Einkauf vor Ort für Privatkunden.",
      },
    ],
    faq: [],
    relatedSlugs: ["lebensmittel", "obst", "tk-tiefkuehl"],
  },
  asia: {
    title: "Asiatische Küche Großhandel Köln",
    description:
      "Asiatische Lebensmittel Großhandel in Köln für Restaurant und Handel. Bosporus GmbH Köln-Ossendorf – Sortiment für asiatische Küche.",
    h1: "Asiatische Küche Großhandel in Köln",
    intro:
      "Lebensmittel für asiatische Küche – Bosporus GmbH in Köln-Ossendorf führt Spezialitäten und Zutaten für Restaurants und Handel.",
    sections: [
      {
        heading: "Sortiment für asiatische Gastronomie",
        body: "Zutaten und Spezialitäten für asiatische Restaurants und Imbisse in Köln und Umgebung.",
      },
    ],
    faq: [],
    relatedSlugs: ["gewuerze", "saucen", "lebensmittel"],
  },
};

const DEFAULT_CATEGORY_SEO = (category: Category): CategorySeoContent => ({
  title: `${category.name_de} Großhandel Köln`,
  description: `${category.name_de} – ${category.product_count} Artikel im Bosporus Großhandel Köln-Ossendorf. Online-Shop für Gewerbekunden, Einkauf vor Ort auch für Privatkunden.`,
  h1: `${category.name_de} Großhandel in Köln`,
  intro: `${category.name_de} bei Bosporus GmbH in Köln-Ossendorf – ${category.product_count} Artikel für Gastronomie und Handel. Unser Online-Shop richtet sich an Gewerbekunden; vor Ort können auch Privatkunden einkaufen.`,
  sections: [],
  faq: [],
  relatedSlugs: ["lebensmittel", "getraenke"],
});

export function getCategorySeo(category: Category): CategorySeoContent {
  return CATEGORY_SEO[category.slug] ?? DEFAULT_CATEGORY_SEO(category);
}

/** Sitemap / interne Links: keine SEO-Kategorie */
export const NON_SEO_CATEGORY_SLUGS = new Set([
  "pfand",
  "lieferung-fracht",
  "transportkosten",
]);
