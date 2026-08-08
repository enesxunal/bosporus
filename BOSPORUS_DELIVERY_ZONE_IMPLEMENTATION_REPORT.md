# Bosporus Delivery Zone UX — Implementation Report

Tarih: 2026-08-09  
Kapsam: Public PLZ / Liefergebiet checker  
**Yapılmayanlar:** Production deploy · DB migration · seed · payment/checkout hesap mantığı değişikliği · uydurma PLZ listesi

---

## SON KARAR: **A) Deploya hazır**

---

## 1. Source of truth

| Kaynak | Kullanım |
|--------|----------|
| `delivery_settings` (`b2b_delivery`) | Min sipariş, free threshold, max km |
| `delivery_fee_bands` (`b2b_delivery`) | Tahmini ücret (km) |
| `delivery_zones` | Zone adı (Köln Zentrum / Umland / NRW… seed + admin) |
| `quoteDelivery({ isB2b: true })` | Geocoding + radius + fee |
| `COMPANY.openingHours` | Pickup 08:00–18:00 |
| Nominatim (server) | Geocoding — key yok, client’a sızmaz |

**Zone isimleri:** DB seed (`001` / `008`) + admin; hardcoded fallback `src/lib/delivery.ts`.

**Kritik:** Guest `POST /api/delivery/quote` hâlâ `b2c_delivery` **100/250** döndürebilir. Public PLZ checker **bu endpoint’i kullanmaz**.

---

## 2. Yeni API

`GET /api/catalog/delivery-check?zipCode=50829`

- Public, rate limit: 40 / saat / IP
- Zorunlu **B2B** kuralları (`segment: "b2b_delivery"`)
- 5 haneli PLZ validation
- Response: `status` (`serviceable` \| `out_of_range` \| `uncertain`), zone adları, `minOrderAmount`, `freeDeliveryThreshold`, `deliveryFeeEstimate`, pickup saatleri
- B2C 100/250 sızıntısı: `assertNoB2cPublicLeak` + test
- Raw DB hata yok (`CHECK_FAILED` / `INVALID_PLZ`)

Dosyalar:
- `src/lib/delivery-check.ts`
- `src/lib/delivery-check.test.ts`
- `src/app/api/catalog/delivery-check/route.ts`

---

## 3. UI / route

| Route | DE / TR |
|-------|---------|
| `/[locale]/delivery` | Liefergebiet / Teslimat Bölgesi |

- `DeliveryPlzChecker` — PLZ input, sonuç kartı, WhatsApp/telefon fallback
- Checkout notu: kesin ücret adrese göre
- Uncertain / out-of-range: “Bitte kontaktieren Sie uns…” + WhatsApp (`COMPANY.whatsappPhone`)
- Mobile: `pb-28` WhatsApp float ile çakışmayı azaltır

---

## 4. Entegrasyonlar

- Ana sayfa CTA → `/delivery`
- `/grosshandel` CTA → `/delivery`
- Cart B2B bandı → link `/delivery` (`cart.deliveryRegion`)
- SEO: `page-seo.ts` `/delivery` + sitemap
- i18n: `deliveryCheck.*` (de/tr)

---

## 5. B2C 100/250 sızıntısı

| Kontrol | Sonuç |
|---------|--------|
| Public checker guest quote kullanıyor mu? | **Hayır** |
| Min order kaynağı | `b2b_delivery` settings |
| Unit test leak guard | **PASS** |

---

## 6. Kalite

| Komut | Sonuç |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (`/delivery`, `/api/catalog/delivery-check`) |
| `npm test` | PASS (delivery-check 8 tests dahil) |
| eslint (hedef dosyalar) | PASS |

---

## 7. Production deploy adımları (sonraki tur)

1. Commit push (SSH)
2. Vercel production Ready
3. Smoke: `/de/delivery`, `/tr/delivery`, `GET /api/catalog/delivery-check?zipCode=50829`
4. Invalid PLZ → 400
5. Response’ta 100/250 olmadığını doğrula
6. Checkout/quote regressiyonu (değişmemeli)

Rollback: commit revert / önceki deployment promote. DB değişikliği yok.

---

## Değişen dosyalar (özet)

- `src/lib/delivery-check.ts` (+ test)
- `src/app/api/catalog/delivery-check/route.ts`
- `src/app/[locale]/(shop)/delivery/*`
- `src/components/b2c/DeliveryPlzChecker.tsx`
- `src/messages/de.json`, `tr.json`
- `src/lib/page-seo.ts`, `src/app/sitemap.ts`
- Home / grosshandel / cart CTA
- `BOSPORUS_DELIVERY_ZONE_IMPLEMENTATION_REPORT.md`
