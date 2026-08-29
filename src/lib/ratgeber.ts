export type RatgeberFaq = { question: string; answer: string };

export type RatgeberSection = {
  id: string;
  heading: string;
  paragraphs: string[];
};

export type RatgeberArticle = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: RatgeberSection[];
  faq: RatgeberFaq[];
  relatedCategorySlugs: string[];
  relatedProductSkus: string[];
  keywords: string[];
};

export const RATGEBER_ARTICLES: RatgeberArticle[] = [
  {
    slug: "lebensmittel-grosshandel-koeln",
    title: "Lebensmittel Großhandel Köln: Tipps für Gastronomie & Handel",
    description:
      "Was Gastronomie und Wiederverkäufer beim Lebensmittel Großhandel in Köln beachten sollten – Bosporus GmbH Köln-Ossendorf.",
    h1: "Lebensmittel Großhandel Köln: Was Gastronomie und Wiederverkäufer beachten sollten",
    intro:
      "Bosporus GmbH ist ein Lebensmittel- und Getränke-Großhandel mit Standort in Köln-Ossendorf. Wer einen Betrieb in Gastronomie, Imbiss, Kiosk oder Einzelhandel führt, braucht zuverlässige Bezugsquellen – online für Gewerbekunden, vor Ort auch für Privatkunden.",
    sections: [
      {
        id: "sortiment",
        heading: "Sortiment und Kategorien",
        paragraphs: [
          "Ein guter Lebensmittel-Großhandel deckt Grundnahrungsmittel, Tiefkühlware, Getränke, Gewürze, Saucen und Verpackung ab. Bei Bosporus finden Sie über 1.500 Artikel in übersichtlichen Kategorien – von Lebensmittel über Getränke bis Hygiene.",
          "Gewerbekunden sehen nach Freigabe Nettopreise und bestellen online ab 500 € Mindestbestellwert. Privatkunden können am Standort Von-Hünefeld-Str. 2 in Köln-Ossendorf direkt einkaufen.",
        ],
      },
      {
        id: "lieferung-abholung",
        heading: "Lieferung und Abholung",
        paragraphs: [
          "Für freigeschaltete Gewerbekunden bietet Bosporus Lieferung in Köln und Umgebung sowie Abholung am Standort. Die erste Lieferung ist gratis; danach gelten die üblichen Lieferzonen und Mindestbestellwerte.",
          "Parkplätze stehen direkt vor Ort zur Verfügung – praktisch für schnelle Abholungen zwischendurch.",
        ],
      },
    ],
    faq: [
      {
        question: "Wo befindet sich Bosporus in Köln?",
        answer: "Von-Hünefeld-Str. 2, 50829 Köln (Ossendorf).",
      },
      {
        question: "Können Privatkunden online bestellen?",
        answer:
          "Nein. Der Online-Shop ist ausschließlich für freigeschaltete Gewerbekunden. Privatkunden kaufen vor Ort.",
      },
    ],
    relatedCategorySlugs: ["lebensmittel", "getraenke", "tk-tiefkuehl"],
    relatedProductSkus: [],
    keywords: ["Lebensmittel Großhandel Köln", "Gastro Großhandel Köln"],
  },
  {
    slug: "getraenke-grosshandel-koeln",
    title: "Getränke Großhandel Köln: Restaurant, Kiosk & Imbiss",
    description:
      "Getränke Großhandel in Köln für Restaurant, Kiosk und Imbiss – Sortiment, Bezug und Tipps von Bosporus GmbH.",
    h1: "Getränke Großhandel Köln: Getränke für Restaurant, Kiosk und Imbiss",
    intro:
      "Getränke sind in Gastronomie und Handel ein zentraler Umsatzträger. Bosporus GmbH in Köln-Ossendorf führt Wasser, Softdrinks, Ayran, Säfte und Energy Drinks für professionelle Abnehmer.",
    sections: [
      {
        id: "sortiment-getraenke",
        heading: "Typisches Getränkesortiment",
        paragraphs: [
          "Restaurants und Imbisse benötigen Erfrischungsgetränke, Wasser und oft Ayran. Kioske ergänzen Energy Drinks und Säfte. Bosporus bündelt diese Artikel in der Kategorie Getränke – mit Gebinden für den Großhandelsbedarf.",
          "Online bestellen können ausschließlich Gewerbekunden nach Freigabe. Privatkunden erwerben Getränke direkt am Standort in Köln-Ossendorf.",
        ],
      },
    ],
    faq: [
      {
        question: "Führt Bosporus Ayran für Dönerläden?",
        answer: "Ja, u.a. Ayfit Ayran 250 ml in der Kategorie Molkerei und Getränke.",
      },
    ],
    relatedCategorySlugs: ["getraenke", "molkerei", "alkohol"],
    relatedProductSkus: ["ayfit-ayran-250ml"],
    keywords: ["Getränke Großhandel Köln", "Getränke für Gastronomie"],
  },
  {
    slug: "ayran-grosshandel",
    title: "Ayran Großhandel: Für Gastronomie, Dönerladen & Handel",
    description:
      "Ayran Großhandel für Dönerladen, Imbiss und Lebensmittelhandel – Bosporus GmbH Köln mit Ayfit Ayran und weiteren Sorten.",
    h1: "Ayran Großhandel für Gastronomie und Lebensmittelhandel",
    intro:
      "Ayran gehört in vielen Dönerläden und Imbissen zum Standardangebot. Bosporus GmbH in Köln-Ossendorf führt Ayran-Sorten wie Ayfit Ayran 250 ml für Gastronomie und Wiederverkäufer.",
    sections: [
      {
        id: "ayran-sortiment",
        heading: "Ayran-Sorten bei Bosporus",
        paragraphs: [
          "In den Kategorien Molkerei und Getränke finden Sie verschiedene Ayran-Marken und Gebindegrößen. Ayfit Ayran 250 ml ist eine häufig nachgefragte Größe für Theke und Gastronomie.",
          "Bestellung online nur für freigeschaltete Gewerbekunden. Privatkunden können Ayran und andere Artikel am Standort in Köln-Ossendorf kaufen.",
        ],
      },
    ],
    faq: [
      {
        question: "Welche Ayran-Größen gibt es?",
        answer: "Je nach Sorte z.B. 250 ml und 500 ml – siehe Produktdetails im Sortiment.",
      },
    ],
    relatedCategorySlugs: ["molkerei", "getraenke"],
    relatedProductSkus: ["ayfit-ayran-250ml"],
    keywords: ["Ayran Großhandel", "Ayfit Ayran"],
  },
  {
    slug: "gastro-grosshandel-koeln",
    title: "Gastro Großhandel Köln: Lebensmittel & Getränke für Restaurants",
    description:
      "Gastro Großhandel in Köln für Restaurants, Imbisse und Cafés – Bosporus GmbH mit Lebensmitteln, Getränken und Tiefkühlware.",
    h1: "Gastro Großhandel Köln: Lebensmittel und Getränke für Restaurants & Imbisse",
    intro:
      "Restaurants, Imbisse, Kioske und Cafés in Köln und Umgebung beliefern sich beim Großhandel – Bosporus GmbH in Köln-Ossendorf bietet Lebensmittel, Getränke, Tiefkühl, Gewürze, Saucen und Verpackung aus einer Hand.",
    sections: [
      {
        id: "gastro-bedarf",
        heading: "Typischer Bedarf in der Gastronomie",
        paragraphs: [
          "Für die tägliche Küche brauchen Gastronomiebetriebe frische und haltbare Lebensmittel, passende Getränke, Tiefkühlware für schnelle Gerichte sowie Gewürze und Saucen. Bosporus strukturiert das Sortiment in Kategorien wie Lebensmittel, Getränke, Tiefkühl, Gewürze und Saucen.",
          "Gewerbekunden registrieren sich mit USt-IdNr., erhalten nach Prüfung Nettopreise und bestellen online. Mindestbestellwert 500 €, erste Lieferung gratis.",
        ],
      },
      {
        id: "vor-ort",
        heading: "Einkauf vor Ort",
        paragraphs: [
          "Neben dem Online-Shop können Kunden am Standort Von-Hünefeld-Str. 2 einkaufen – auch Privatkunden. Parkplätze sind vor Ort vorhanden, Öffnungszeiten Mo.–Sa. 08:00–18:00 Uhr.",
        ],
      },
    ],
    faq: [
      {
        question: "Für wen ist der Bosporus Gastro-Großhandel geeignet?",
        answer:
          "Gastronomie, Restaurants, Imbisse, Kioske, Cafés, Einzelhandel, Wiederverkäufer und weitere Gewerbekunden.",
      },
    ],
    relatedCategorySlugs: ["lebensmittel", "getraenke", "tk-tiefkuehl", "gewuerze"],
    relatedProductSkus: [],
    keywords: ["Gastro Großhandel Köln", "Großhandel für Restaurants"],
  },
  {
    slug: "tiefkuehl-grosshandel-koeln",
    title: "Tiefkühl Großhandel Köln für Imbiss & Restaurant",
    description:
      "Tiefkühl Großhandel in Köln: TK-Fleisch, Nuggets, Pommes für Gastronomie – Bosporus GmbH Köln-Ossendorf.",
    h1: "Tiefkühl Großhandel Köln für Imbiss und Restaurant",
    intro:
      "Tiefkühlprodukte sparen Zeit in Imbiss und Restaurant – Bosporus GmbH in Köln-Ossendorf führt TK-Ware wie Chicken Nuggets, Hotwings und weitere Artikel für den Gastronomiebedarf.",
    sections: [
      {
        id: "tk-sortiment",
        heading: "Tiefkühl für schnelle Küche",
        paragraphs: [
          "In der Kategorie Tiefkühl finden Sie Artikel wie Real American Chicken Nuggets und weitere TK-Produkte für hohen Durchsatz. Ergänzend liefern Kategorien wie Saucen und Gewürze alles für den Betrieb.",
          "Online-Bestellung für Gewerbekunden, Einkauf vor Ort auch für Privatkunden. Standort: Köln-Ossendorf, Parkplätze vorhanden.",
        ],
      },
    ],
    faq: [],
    relatedCategorySlugs: ["tk-tiefkuehl", "saucen", "lebensmittel"],
    relatedProductSkus: ["real-american-chicken-nuggets-halal-1kg-halal"],
    keywords: ["Tiefkühl Großhandel Köln", "TK Gastronomie"],
  },
];

export function getRatgeberArticle(slug: string): RatgeberArticle | undefined {
  return RATGEBER_ARTICLES.find((a) => a.slug === slug);
}

export function getAllRatgeberSlugs(): string[] {
  return RATGEBER_ARTICLES.map((a) => a.slug);
}
