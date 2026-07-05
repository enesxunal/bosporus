# Bosporus GmbH – E-Commerce MVP

Lebensmittel-Großhandel für Köln: B2C (Lidl-Stil) + B2B (Metro-Stil).

## Design

| Farbe | Hex | Verwendung |
|-------|-----|------------|
| Bosporus Blau | `#1D71B8` | Logo, Header, Buttons, Hauptfarbe |
| Weiß | `#FFFFFF` | Hintergrund, Karten |
| Rot | `#D32F2F` | Nur Aktionen/Indirimler |

## Starten

```bash
npm install
npm run import:products   # artikel.csv → JSON (bereits ausgeführt)
npm run dev               # http://localhost:3000
```

## Seiten

| URL | Beschreibung |
|-----|--------------|
| `/` | B2C Startseite (Karten, Kategorien) |
| `/products` | Produktkatalog |
| `/gewerbe` | B2B Portal (Tabellenansicht) |
| `/gewerbe/register` | Gewerbe-Registrierung + VIES |
| `/cart` | Warenkorb |
| `/checkout` | Teslimat veya Gel-Al (30-Min-Slots) |

## Nächste Schritte

1. `.env.local` aus `.env.example` anlegen (Stripe, Supabase)
2. Supabase-Migration ausführen: `supabase/migrations/001_initial_schema.sql`
3. Admin-Panel
4. Değişken ağırlık, QR, Choco (später)
