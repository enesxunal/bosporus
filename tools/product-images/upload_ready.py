#!/usr/bin/env python3
"""
Hazır görselleri (out/ready/{sku}.jpg) Supabase Storage'a yükleyip products tablosunu günceller.

Gerekli env (Vercel production'dan kopyalayın veya .env.local):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Kullanım:
  source .venv/bin/activate
  export NEXT_PUBLIC_SUPABASE_URL=...
  export SUPABASE_SERVICE_ROLE_KEY=...
  python upload_ready.py --limit 10
  python upload_ready.py
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT_READY = ROOT / "out" / "ready"
PROGRESS = ROOT / "out" / "upload_progress.json"


def env(name: str) -> str:
    v = (os.environ.get(name) or "").strip()
    if not v:
        raise SystemExit(f"Eksik env: {name}")
    return v.rstrip("/")


def load_progress() -> dict:
    if PROGRESS.exists():
        return json.loads(PROGRESS.read_text(encoding="utf-8"))
    return {"uploaded": {}, "failed": {}}


def save_progress(p: dict) -> None:
    PROGRESS.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS.write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.2)
    args = parser.parse_args()

    base = env("NEXT_PUBLIC_SUPABASE_URL")
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

    files = sorted(OUT_READY.glob("*.jpg"))
    if args.limit > 0:
        files = files[: args.limit]

    progress = load_progress()
    print(f"Yüklenecek: {len(files)}")

    ok = fail = skip = 0
    for i, path in enumerate(files, 1):
        sku = path.stem
        if sku in progress.get("uploaded", {}):
            skip += 1
            continue

        storage_path = f"products/{sku}.jpg"
        public_url = f"{base}/storage/v1/object/public/product-images/{storage_path}"

        print(f"[{i}/{len(files)}] {sku}")
        data = path.read_bytes()
        ctype = mimetypes.guess_type(path.name)[0] or "image/jpeg"

        up = requests.post(
            f"{base}/storage/v1/object/product-images/{storage_path}",
            headers={**headers, "Content-Type": ctype, "x-upsert": "true"},
            data=data,
            timeout=60,
        )
        if up.status_code not in (200, 201):
            # try update
            up = requests.put(
                f"{base}/storage/v1/object/product-images/{storage_path}",
                headers={**headers, "Content-Type": ctype},
                data=data,
                timeout=60,
            )
        if up.status_code not in (200, 201):
            progress["failed"][sku] = up.text[:300]
            save_progress(progress)
            fail += 1
            print(f"  ✗ upload {up.status_code}")
            continue

        # Update product by sku
        patch = requests.patch(
            f"{base}/rest/v1/products?sku=eq.{sku}",
            headers={
                **headers,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json={"image_url": public_url, "image_urls": [public_url]},
            timeout=30,
        )
        if patch.status_code not in (200, 204):
            progress["failed"][sku] = f"db:{patch.status_code}:{patch.text[:200]}"
            save_progress(progress)
            fail += 1
            print(f"  ✗ db {patch.status_code}")
            continue

        progress["uploaded"][sku] = public_url
        progress["failed"].pop(sku, None)
        save_progress(progress)
        ok += 1
        print(f"  ✓ {public_url}")
        time.sleep(args.sleep)

    print(f"\nBitti. yüklenen={ok} atlanan={skip} hata={fail}")


if __name__ == "__main__":
    main()
