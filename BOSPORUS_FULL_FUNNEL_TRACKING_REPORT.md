# Bosporus — Full Funnel Tracking (All Visitors) — Implementation Report

Bu tur **yalnızca yerel geliştirme + kalite kontrolüdür**: production migration çalıştırılmadı,
production deploy yapılmadı, sahte ziyaretçi/event üretilmedi, gerçek müşteri datası değiştirilmedi.
Çalışma `feat/full-funnel-tracking` branch'inde yapıldı (origin/main = mevcut approved-B2B funnel işi).

---

## 1. Architecture

İki katmanlı funnel, iki ayrı veri kaynağı üzerinden birleşik gösterilir:

- **Visitor funnel (yeni)** — tüm ziyaretçiler (misafir dahil): `site_funnel_events` tablosu.
- **Approved B2B funnel (mevcut, dokunulmadı)** — `b2b_funnel_events` tablosu.

Dashboard'da üstte tab: **"Tüm Ziyaretçiler"** ve **"Approved B2B"**. Visitor funnel'ın
alt kademesi (Approved → Checkout → Purchase) mevcut `b2b_funnel_events` verisinden okunur;
böylece PAYMENT-TEST hariç tutma kuralı otomatik korunur ve tek doğru kaynak kullanılır.

Veri akışı:
```
Client (guest/auth)  ──POST /api/funnel/event──►  site_funnel_events   (service role)
Auth olunca          ──POST /api/funnel/identity─►  visitor_identity_links
Purchase (server)    ──recordSitePurchase────────►  site_funnel_events (purchase)
Admin dashboard      ──GET /api/admin/site-funnel─►  summarizeSiteFunnel() (aggregate)
```

## 2. Anonymous visitor model

- `bosporus_anon_id`: `crypto.randomUUID()` ile üretilen opak, first-party, stabil id (localStorage).
- PII değildir; e-posta/telefon hash'i, IP veya fingerprint değildir.
- Format server-side doğrulanır: `^[0-9a-fA-F-]{16,64}$` (`isFirstPartyId`).
- Kaynak: `src/lib/visitor-id.ts`.

## 3. Session model

- `bosporus_session_id`: visitor id'den ayrı opak id.
- 30 dk hareketsizlikten sonra rotasyon (`SESSION_INACTIVITY_MS`, `bosporus_session_ts`).
- İki metrik üretir: **distinct visitor** ve **distinct session**.

## 4. Event schema

Yeni tablo `site_funnel_events` (migration `019_full_funnel_tracking.sql`):

| kolon | açıklama |
|------|----------|
| `id` uuid | PK |
| `anonymous_id` text null | first-party id (regex CHECK) |
| `session_id` text null | first-party id (regex CHECK) |
| `user_id` uuid null | `auth.users` FK, `ON DELETE SET NULL` |
| `event_name` text | CHECK allowlist |
| `metadata` jsonb | yalnız bucketlı/normalize alanlar |
| `dedupe_key` text | session-scoped idempotency |
| `created_at` timestamptz | |

- CHECK: en az bir kimlik (`anonymous_id` veya `user_id`) zorunlu.
- Indeksler: `created_at`, `event_name+created_at`, `anonymous_id+created_at`,
  `user_id+created_at`, `session_id`, unique `(event_name, dedupe_key)`.
- RLS **enabled**, `anon`/`authenticated` için `REVOKE ALL` — yalnız service role okur/yazar.

Event allowlist (server-side, `SITE_FUNNEL_EVENT_NAMES`):
`site_visit, product_view, add_to_cart, cart_view, min_order_blocked, register_view,
login_view, registration_started, registration_completed, b2b_application_submitted,
begin_checkout, quick_order_view, quick_order_used, purchase`.
`purchase` **client-writable değildir** (`CLIENT_WRITABLE_EVENTS` dışında) — yalnız server üretir.

## 5. Identity linking

- Ayrı tablo `visitor_identity_links (anonymous_id, user_id, linked_at)`, PK `(anonymous_id,user_id)`.
- Geçmiş eventler **destructive UPDATE ile yeniden yazılmaz**; dashboard sorgu anında birleştirir.
- `journeyKey = user_id ?? map(anonymous_id → user_id) ?? anonymous_id`.
- `POST /api/funnel/identity`: `user_id` **yalnız session'dan** çözülür, body'den kabul edilmez →
  başka kullanıcıya link spoof edilemez. `AuthContext` login sonrası `claimVisitorIdentity()` çağırır.

## 6. Acquisition integration

- Mevcut `user_acquisition` first-touch mantığı **korunur, overwrite yok**.
- Anonim ziyaretçide source, ilk first-touch'tan türetilip `bosporus_source` (localStorage) ile
  kalıcı hale gelir; her site event'ine normalize `source` olarak eklenir (Google Ads / Facebook /
  Instagram / TikTok / Organic / Direct / Referral / Unknown).
- Journey source önceliği: site event metadata.source → `user_acquisition.source` → `unknown`.

## 7. Visitor funnel

Aşamalar (distinct journey): Visit → Product View → Add to Cart → Cart View →
Register/Login → B2B Application → **Approved → Checkout → Purchase**.
UI'da her aşama "ziyaretçi seviyesi" / "kullanıcı seviyesi" olarak açıkça etiketlenir.

## 8. Approved B2B funnel

Mevcut dashboard/gösterim **değiştirilmedi**; ayrı tab olarak korunur. `b2b_funnel_events`,
`recordPurchase`, first-login vb. dokunulmadı.

## 9. Source breakdown

`source × {visitor, view, cart, register, application, approved, checkout, purchase}` tablosu —
distinct journey bazında. Reklam optimizasyonu için ana rapor. `firstTouchNote` ile
attribution sınırı dürüstçe belirtilir.

## 10. Device breakdown

- Coarse kategori: `mobile / tablet / desktop` (+ `unknown`). Viewport + `pointer: coarse`
  ipucundan türetilir; **ham user-agent saklanmaz, fingerprint yok**.
- `device × {view, cart, register, checkout, purchase}` tablosu.

## 11. Privacy / security

- Toplanan: `anonymous_id`, `session_id`, `user_id`, normalized `source`, coarse `device`,
  bucketlı funnel metadata (`price_bucket`, `subtotal_bucket`, `item_count_bucket`, `quantity`,
  `min_required`, `segment`, `order_type`, `locale`).
- **Yapılmayanlar**: fingerprint/canvas, IP persistence, full UA persistence, e-posta/telefon,
  cross-site tracking, third-party stitching.
- `buildSiteEventMetadata` yalnız allowlisted alanları yazar (PII strip testli).
- `POST /api/funnel/event`: allowlist + tip doğrulama + 2KB payload limiti + rate limit
  (240/10dk, anon id veya IP), `user_id` client'tan **kabul edilmez** (session'dan çözülür),
  purchase/approval reddedilir. Tablolar RLS + REVOKE ALL.

## 12. Performance

- `site_visit` session başına bir kez (client `onceGuard` + server dedupe).
- `product_view` session+ürün başına throttle (client + `dedupe_key`).
- Uygun indeksler eklendi (bkz. §4). Admin sorguları 1000'lik sayfalama ile paged.
- Analytics çağrıları `keepalive` + hata yutan; alışverişi asla bloklamaz.

## 13. Migration

- `supabase/migrations/019_full_funnel_tracking.sql` — **additive only**: no drop, no backfill,
  no destructive update. Bu turda **çalıştırılmadı** (manuel uygulanacak).

## 14. Tests

`src/lib/site-funnel.test.ts` (12 test, tümü geçiyor) kapsam:
anon visitor id oluşturma + stabilite, session id rotasyonu, fingerprint yokluğu, coarse device,
allowlist, client user_id/PII strip, purchase gibi kritik event reddi, bozuk id reddi,
metadata allowlist, session dedupe, identity link NO-OP, purchase test-SKU + guest exclusion,
anon→auth birleştirme, source breakdown distinct visitor, device breakdown, 0/0 fallback,
deterministik insight.

## 15. Dashboard changes

- `/admin/funnel` sayfasına tab eklendi; **Approved B2B görünümü aynen korundu**.
- Yeni `VisitorFunnelView`: KPI kartları, ziyaretçi hunisi (drop-off + conversion),
  source breakdown tablosu, device breakdown tablosu, drop-off analizi, deterministik insight,
  loading/error/empty/0-0 fallback. TR + DE çeviriler (`siteFunnel` namespace).

## 16. Production rollout plan (öneri)

1. `019_full_funnel_tracking.sql`'i Supabase SQL Editor'da manuel uygula (read-only doğrulama sonrası).
2. Kod deploy (auto-deploy GitHub → Vercel). Tablo yoksa admin API graceful `42P01/PGRST205` fallback.
3. Passive smoke: `/`, `/products`, `/cart`, `/login`, `/register`, `/admin/funnel` (guest → 401).
4. **Retention önerisi (bu turda job eklenmedi)**: raw `site_funnel_events` 90–180 gün,
   aggregate/rapor uzun süre. İleride zamanlanmış `DELETE` veya partition + `pg_cron` önerilir.

## 17. Final decision

**A) Full-funnel tracking deploya hazır.**

Kalite kapıları yerelde geçti: `tsc --noEmit` temiz, `npm test` 70/70, hedef ESLint temiz,
`npm run build` başarılı. Mevcut approved-B2B tracking, ödeme akışı ve first-touch attribution
korunarak eklendi. Kalan tek adım: production migration + deploy (kullanıcı onayıyla).
