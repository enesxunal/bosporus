# Bosporus Favorites — Implementation Report

Tarih: 2026-08-09  
Kapsam: Ürün favorileri (girişli kullanıcı) — migration 016, API, UI, analytics, quick-order filtresi  
Bu turda **yapılmadı:** production DB migration apply, production deploy, payment/checkout/delivery değişikliği

---

## SON KARAR: **A) Favoriler deploya hazır**

Kod, build, tsc ve hedefli testler yeşil. Production’a geçmeden önce **ayrı onay** ile 016 migration uygulanmalı; ardından deploy.

---

## Değişen / eklenen dosyalar

### Yeni
- `supabase/migrations/016_product_favorites.sql`
- `src/lib/favorites.ts` / `src/lib/favorites.test.ts`
- `src/app/api/account/favorites/route.ts`
- `src/app/api/account/favorites/[productId]/route.ts`
- `src/contexts/FavoritesContext.tsx`
- `src/components/b2c/FavoriteButton.tsx`
- `src/app/[locale]/(shop)/account/favorites/page.tsx`
- `src/app/[locale]/(shop)/account/favorites/layout.tsx`
- `BOSPORUS_FAVORITES_IMPLEMENTATION_REPORT.md` (bu dosya)

### Güncellenen
- `src/components/providers/ShopProviders.tsx` — `FavoritesProvider`
- `src/components/b2c/ProductCard.tsx` — kalp butonu
- `src/components/b2c/ProductDetailView.tsx` — kalp butonu
- `src/components/layout/AuthNav.tsx` — Favoriten / Favoriler linki
- `src/app/[locale]/(shop)/account/page.tsx` — favoriler linki
- `src/app/[locale]/(shop)/quick-order/page.tsx` — “Nur Favoriten / Sadece favoriler” filtresi
- `src/lib/analytics.ts` — `add_to_wishlist` / `remove_from_wishlist`
- `src/lib/page-seo.ts` — `/account/favorites`
- `src/messages/de.json` / `src/messages/tr.json`

---

## Migration 016 — `product_favorites`

### Tablo yapısı
| Alan | Tip | Not |
|------|-----|-----|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid NOT NULL | `auth.users(id)` ON DELETE CASCADE |
| `product_id` | uuid NOT NULL | `products(id)` ON DELETE CASCADE (`products.id` UUID PK ile uyumlu) |
| `created_at` | timestamptz NOT NULL | default `now()` |

- **Unique:** `(user_id, product_id)`
- **Index:** `user_id`, `product_id`

### RLS
- RLS **ENABLED**
- `SELECT` — `auth.uid() = user_id`
- `INSERT` — `WITH CHECK (auth.uid() = user_id)`
- `DELETE` — `auth.uid() = user_id`
- **UPDATE policy yok** (gerek yok)

### SQL özeti
Dosya: `supabase/migrations/016_product_favorites.sql`  
Production’a **henüz uygulanmadı** (bu turda bilinçli).

---

## API

| Method | Path | Davranış |
|--------|------|----------|
| GET | `/api/account/favorites` | Auth zorunlu. Varsayılan: `{ productIds }`. `?details=1` → ürün join + `is_active !== false` degrade |
| POST | `/api/account/favorites` | Body: `{ productId }`. `user_id` = session (`requireUser`). Ürün yok → 404. Unique violation → idempotent 200 |
| DELETE | `/api/account/favorites/[productId]` | Sadece current user satırı; idempotent |

Güvenlik:
- Client `user_id` kabul edilmez
- 401 auth yok
- 400 invalid productId
- 404 ürün yok
- Ham DB mesajı client’a gitmez (`LOAD_FAILED` / `SAVE_FAILED` vb.)

---

## FavoritesProvider / state

- Login sonrası **tek** `GET /api/account/favorites` → `Set<string>`
- ProductCard başına N+1 yok
- `isFavorite` / `addFavorite` / `removeFavorite` / `toggleFavorite`
- Optimistic update + API fail → rollback
- Misafir: localStorage yok; kalp → `/login`

---

## UI

- **ProductCard:** sağ üst outline/filled heart; sepete ekle bozulmaz
- **Product detail:** görsel + CTA yanında aynı shared state
- **Favorites page:** `/[locale]/account/favorites` — desktop tablo, mobile kart; OOS → sepete ekle disabled; boş state + “Sortiment ansehen / Ürünleri görüntüle”
- **Account nav:** girişli non-admin → Favoriten / Favoriler (misafir görmez)

---

## B2B kuralları

- Favori için giriş yeterli; B2B approval şart değil
- Sepete ekleme / checkout gate değişmedi
- Favoriler checkout yetkisini bypass etmez

---

## Quick-order entegrasyonu (Commit 2)

- Client-side checkbox: mevcut arama sonuçlarını `favorites` Set ile filtreler
- Ek katalog API çağrısı yok → performans etkisi düşük
- Metinler: `quickOrder.onlyFavorites`

---

## Analytics

- GA4 `add_to_wishlist` (`item_id`, `item_name`, `price`, `currency: EUR`, items[])
- Custom `remove_from_wishlist`
- Google Ads primary / Meta Lead-Purchase **değil**

---

## Test sonuçları

```
npm test -- src/lib/favorites.test.ts  → 12 passed
npm test                               → 53 passed (5 files)
npx tsc --noEmit                       → OK
npm run build                          → OK (routes: /account/favorites, /api/account/favorites*)
eslint (hedef favori dosyaları)        → OK
```

Not: `account/page.tsx` içinde pre-existing `loadAll` lint borcu var; bu feature’a karıştırılmadı.

Kapsanan unit güvenlik senaryoları: invalid productId, ownership 403/404, unique 23505, optimistic set, favorites filter.

---

## Production deploy sırası (onay sonrası)

1. **Onay:** Migration 016 SQL + RLS review
2. Supabase production’da `016_product_favorites.sql` apply
3. Deploy uygulama kodu (commit 1 + 2)
4. Smoke:
   - Login → kalp ekle/çıkar
   - `/account/favorites` liste + sepete ekle
   - Misafir → login yönlendirme
   - Quick-order “Nur Favoriten”
   - Checkout gate değişmediğini kontrol
5. Rollback planı hazır tut

---

## Migration apply adımı (manuel, onaylı)

```bash
# Örnek — proje ortamınıza göre:
# supabase db push  veya  SQL Editor’de 016 dosyasını çalıştır
```

Uygulamadan önce staging/preview’da aynı SQL’i doğrulayın.

---

## Rollback planı

1. UI/API deploy’unu önceki release’e geri al
2. İsteğe bağlı: `DROP TABLE IF EXISTS product_favorites CASCADE;` (favori verisi silinir)
3. Policy’ler tablo ile birlikte düşer

Checkout/payment etkilenmez (ayrı tablolar).

---

## Commit stratejisi

1. `feat(account): add product favorites`
2. `feat(quick-order): add favorites filter`
