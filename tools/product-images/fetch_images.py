#!/usr/bin/env python3
"""
Bosporus – ürün görsellerini lokal bulup 1080x1080 hazırla.

Kullanım:
  cd tools/product-images
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

  # Önce 5 ürünle test:
  python fetch_images.py --limit 5

  # Tüm aktif ürünler (resume destekli):
  python fetch_images.py

  # Sadece bir kategori:
  python fetch_images.py --category getraenke

  # Arka plan silmeyi dene (rembg kurulu olmalı):
  python fetch_images.py --limit 5 --rembg
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[1]
PRODUCTS_JSON = PROJECT / "src" / "data" / "products.json"
OUT = ROOT / "out"
DIR_RAW = OUT / "raw"
DIR_READY = OUT / "ready"
DIR_FAILED = OUT / "failed"
PROGRESS_FILE = OUT / "progress.json"

CANVAS = 1080
USER_AGENT = "BosporusImageBot/1.0 (local catalog prep; contact info@bosporus-gmbh.com)"


def ensure_dirs() -> None:
    for d in (DIR_RAW, DIR_READY, DIR_FAILED):
        d.mkdir(parents=True, exist_ok=True)


def load_products() -> list[dict[str, Any]]:
    data = json.loads(PRODUCTS_JSON.read_text(encoding="utf-8"))
    return data


def load_progress() -> dict[str, Any]:
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    return {"ok": {}, "failed": {}, "skipped": {}}


def save_progress(progress: dict[str, Any]) -> None:
    PROGRESS_FILE.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8")


def search_queries(name: str) -> list[str]:
    clean = re.sub(r"\s+", " ", name).strip()
    return [
        f'{clean} produktfoto weiß hintergrund',
        f'{clean} packshot white background',
        f'{clean} product photo',
        clean,
    ]


def search_image_urls(query: str, max_results: int = 5) -> list[str]:
    urls: list[str] = []
    try:
        from ddgs import DDGS  # type: ignore
    except ImportError:
        try:
            from duckduckgo_search import DDGS  # type: ignore
        except ImportError as e:
            raise SystemExit(
                "ddgs kurulu değil. Şunu çalıştırın:\n  pip install -r requirements.txt"
            ) from e

    with DDGS() as ddgs:
        results = ddgs.images(
            query,
            region="de-de",
            safesearch="moderate",
            max_results=max_results,
        )
        for item in results or []:
            url = item.get("image") or item.get("url")
            if url and isinstance(url, str) and url.startswith("http"):
                urls.append(url)
    return urls


def download_image(url: str, timeout: int = 20) -> Optional[bytes]:
    try:
        host = urlparse(url).netloc
        r = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT, "Referer": f"https://{host}/"},
            stream=True,
        )
        if r.status_code != 200:
            return None
        ctype = (r.headers.get("Content-Type") or "").lower()
        if "image" not in ctype and not url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            return None
        data = r.content
        if len(data) < 2000 or len(data) > 8_000_000:
            return None
        return data
    except Exception:
        return None


def open_rgb(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1])
        return bg.convert("RGB")
    return img.convert("RGB")


def fit_on_white(img: Image.Image, size: int = CANVAS, padding: float = 0.08) -> Image.Image:
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    max_side = int(size * (1 - 2 * padding))
    w, h = img.size
    scale = min(max_side / w, max_side / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y))
    return canvas


def maybe_rembg(img: Image.Image) -> Image.Image:
    try:
        from rembg import remove  # type: ignore
    except ImportError as e:
        raise RuntimeError("rembg kurulu değil. pip install 'rembg[cpu]'") from e

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    out = remove(buf.getvalue())
    cut = Image.open(io.BytesIO(out)).convert("RGBA")
    bg = Image.new("RGBA", cut.size, (255, 255, 255, 255))
    bg.paste(cut, mask=cut.split()[-1])
    return bg.convert("RGB")


def process_bytes(data: bytes, use_rembg: bool) -> Image.Image:
    img = open_rgb(data)
    if use_rembg:
        img = maybe_rembg(img)
    return fit_on_white(img)


def mark_failed(sku: str, reason: str, progress: dict[str, Any]) -> None:
    (DIR_FAILED / f"{sku}.txt").write_text(reason, encoding="utf-8")
    progress["failed"][sku] = reason
    save_progress(progress)


def fetch_one(product: dict[str, Any], use_rembg: bool, sleep_s: float, progress: dict[str, Any]) -> bool:
    sku = product["sku"]
    name = product.get("name_de") or sku
    ready_path = DIR_READY / f"{sku}.jpg"

    if ready_path.exists():
        progress["skipped"][sku] = "already_ready"
        save_progress(progress)
        return True

    last_err = "no_image"
    for q in search_queries(name):
        try:
            urls = search_image_urls(q, max_results=6)
        except Exception as e:
            last_err = f"search_error:{e}"
            time.sleep(sleep_s)
            continue

        for url in urls:
            data = download_image(url)
            time.sleep(0.4)
            if not data:
                continue
            try:
                (DIR_RAW / f"{sku}.bin").write_bytes(data)
                final = process_bytes(data, use_rembg=use_rembg)
                final.save(ready_path, format="JPEG", quality=90, optimize=True)
                progress["ok"][sku] = {"query": q, "url": url}
                progress["failed"].pop(sku, None)
                save_progress(progress)
                fail_note = DIR_FAILED / f"{sku}.txt"
                if fail_note.exists():
                    fail_note.unlink()
                return True
            except Exception as e:
                last_err = f"process_error:{e}"
                continue

        time.sleep(sleep_s)

    mark_failed(sku, last_err, progress)
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Bosporus ürün görsel botu")
    parser.add_argument("--limit", type=int, default=0, help="Kaç ürün (0 = hepsi)")
    parser.add_argument("--category", type=str, default="", help="Sadece bu category_slug")
    parser.add_argument("--offset", type=int, default=0, help="Başlangıç sırası")
    parser.add_argument("--rembg", action="store_true", help="Arka plan sil (yavaş)")
    parser.add_argument("--sleep", type=float, default=1.5, help="Arama arası bekleme (sn)")
    parser.add_argument("--only-missing", action="store_true", default=True, help="image_url boş olanlar")
    parser.add_argument("--include-with-image", action="store_true", help="Görseli olanları da dene")
    args = parser.parse_args()

    ensure_dirs()
    products = load_products()
    products = [p for p in products if p.get("is_active") and (p.get("price_b2c") or 0) > 0]

    if args.category:
        products = [p for p in products if p.get("category_slug") == args.category]

    if not args.include_with_image:
        products = [p for p in products if not (p.get("image_url") or (p.get("image_urls") or []))]

    products = products[args.offset :]
    if args.limit > 0:
        products = products[: args.limit]

    progress = load_progress()
    print(f"İşlenecek ürün: {len(products)}")
    print(f"Çıktı klasörü: {DIR_READY}")
    if args.rembg:
        print("rembg AÇIK — daha yavaş")

    ok = fail = skip = 0
    for i, p in enumerate(products, 1):
        sku = p["sku"]
        ready = DIR_READY / f"{sku}.jpg"
        if ready.exists():
            skip += 1
            print(f"[{i}/{len(products)}] SKIP {sku}")
            continue

        print(f"[{i}/{len(products)}] {p.get('name_de', sku)[:70]}")
        try:
            success = fetch_one(p, use_rembg=args.rembg, sleep_s=args.sleep, progress=progress)
        except KeyboardInterrupt:
            print("\nDurduruldu. İlerleme kaydedildi — tekrar çalıştırınca kaldığı yerden devam eder.")
            save_progress(progress)
            sys.exit(130)
        except Exception as e:
            mark_failed(sku, str(e), progress)
            success = False

        if success:
            ok += 1
            print(f"  ✓ {sku}.jpg")
        else:
            fail += 1
            print(f"  ✗ {progress['failed'].get(sku, 'failed')}")

        time.sleep(args.sleep)

    print("\nBitti.")
    print(f"  Hazır: {ok}")
    print(f"  Atlandı (zaten vardı): {skip}")
    print(f"  Başarısız: {fail}")
    print(f"  Klasör: {DIR_READY}")
    print("Manuel kontrol: out/failed/ içindeki ürünleri sonra düzeltin.")


if __name__ == "__main__":
    main()
