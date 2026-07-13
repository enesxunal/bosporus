# Ürün görselleri – lokal bot

Bu klasör **bilgisayarınızda** çalışır. Siteye otomatik bağlanmaz; önce görselleri toplar, sonra isterseniz yükler.

## Ne yapar?

1. `products.json` içindeki ürünleri okur  
2. İnternetten **beyaz arka planlı** ürün fotoğrafı arar  
3. 1080×1080 beyaz kareye oturtur  
4. `out/ready/{sku}.jpg` olarak kaydeder  

Arka plan silme (`rembg`) **kapalı** gelir. İsterseniz `--rembg` ile açarsınız (yavaş + ilk kurulum ağır).

## Kurulum (bir kez)

Terminalde:

```bash
cd "/Users/enesxunal/Desktop/3 Kare Ajans/Cursor/Bosporus/tools/product-images"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Test (önce 5 ürün)

```bash
source .venv/bin/activate
python fetch_images.py --limit 5
```

Sonuç: `out/ready/` klasörüne bakın.

## Tüm katalog

```bash
python fetch_images.py
```

- Durdurursanız (Ctrl+C) sorun değil — tekrar çalıştırınca **kaldığı yerden** devam eder.  
- Başarısızlar: `out/failed/`  
- Sadece bir kategori: `python fetch_images.py --category getraenke`

## Siteye yükleme (görseller hazır olunca)

Supabase anahtarları gerekir (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`):

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://...."
export SUPABASE_SERVICE_ROLE_KEY="...."
python upload_ready.py --limit 10   # önce deneme
python upload_ready.py              # hepsi
```

## Önerilen sıra

1. `--limit 5` ile test  
2. Bir kategori (ör. `getraenke`)  
3. Tüm ürünler (birkaç saat sürebilir)  
4. `out/failed/` içindeki yanlışları elle düzeltin / Photoshop  
5. `upload_ready.py` ile siteye aktarın  

## Notlar

- Ücretsiz arama bazen engel yiyebilir veya yanlış görsel bulabilir — manuel kontrol şart.  
- `rembg` istiyorsanız: `pip install "rembg[cpu]"` sonra `python fetch_images.py --rembg --limit 3`  
- Photoshop varsa: `out/raw` veya `out/ready` üzerinde toplu düzeltme yapabilirsiniz.
