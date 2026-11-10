#!/usr/bin/env python3
"""
IdentIQ - Human Qari Audio Pipeline
Downloads authentic Sheikh Mishary Rashid Alafasy (128kbps) recitation
mapped directly from verified Quranic references in js/names-data.js.
"""
from __future__ import annotations

import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "js" / "names-data.js"
OUT_DIR = ROOT / "audio"
BASE_URL = "https://everyayah.com/data/Alafasy_128kbps"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IdentIQ-Sync/2.0"
}


def parse_names_data(src: str, key: str) -> list[tuple[int, str]]:
    """Extracts (id, ref) tuples from js/names-data.js."""
    pattern = rf"{key}:\s*Object\.freeze\(\[(.*?)\]\)"
    block = re.search(pattern, src, re.S)
    if not block:
        sys.exit(f"[ERROR] Could not find '{key}' block in {DATA_FILE}")

    matches = re.findall(r'id:\s*(\d+).*?ref:\s*"(\d+:\d+)"', block.group(1), re.S)
    if not matches:
        sys.exit(f"[ERROR] No entries parsed from '{key}' block.")

    return [(int(idx), ref.strip()) for idx, ref in matches]


def ref_to_ayah_filename(ref: str) -> str:
    """Converts 'Surah:Ayah' (e.g. '1:4') to '001004.mp3'."""
    surah_s, ayah_s = ref.split(":")
    return f"{int(surah_s):03d}{int(ayah_s):03d}.mp3"


def download_bytes(url: str, retries: int = 3) -> bytes | None:
    """Downloads audio bytes with retry backoff."""
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
                if len(data) >= 1024:
                    return data
                print(f" [WARN] File under 1KB, retrying ({attempt}/{retries})...")
        except Exception as e:
            if attempt == retries:
                print(f" [FAIL] {url} -> {e}")
                return None
            time.sleep(1.0 * attempt)
    return None


def main() -> int:
    if not DATA_FILE.exists():
        sys.exit(f"[ERROR] {DATA_FILE} not found. Run from IdentIQ root.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = DATA_FILE.read_text(encoding="utf-8")

    categories = [
        ("husna", parse_names_data(src, "husna")),
        ("nabi", parse_names_data(src, "nabi")),
    ]

    total_names = sum(len(items) for _, items in categories)
    print(f"=== IdentIQ Human Audio Sync: {total_names} Target Files ===")
    print(f"Reciter : Sheikh Mishary Rashid Alafasy (128 kbps Studio)")
    print(f"Target  : {OUT_DIR}\n")

    cache: dict[str, bytes] = {}
    success = 0
    failed = []

    for prefix, items in categories:
        for idx, ref in items:
            target_name = f"{prefix}-{idx}.mp3"
            target_path = OUT_DIR / target_name
            ayah_file = ref_to_ayah_filename(ref)
            ayah_url = f"{BASE_URL}/{ayah_file}"

            if ayah_file not in cache:
                print(f"[{success + len(failed) + 1}/{total_names}] Fetching {ayah_file} for {target_name} ({ref})...", end="", flush=True)
                data = download_bytes(ayah_url)
                if data is None:
                    print(" FAILED")
                    failed.append(target_name)
                    continue
                cache[ayah_file] = data
                print(f" OK ({len(data) // 1024} KB)")
            else:
                print(f"[{success + len(failed) + 1}/{total_names}] Mapping cached {ayah_file} -> {target_name} ({ref})... OK")

            target_path.write_bytes(cache[ayah_file])
            success += 1

    (OUT_DIR / ".manifest.json").unlink(missing_ok=True)

    print("\n" + "=" * 50)
    print(f"Sync Complete: {success}/{total_names} files synced successfully.")
    if failed:
        print(f"Failed files: {', '.join(failed)}")
        return 1

    total_size_mb = sum(f.stat().st_size for f in OUT_DIR.glob("*.mp3")) / (1024 * 1024)
    print(f"Total Audio Folder Size: {total_size_mb:.2f} MB")
    print("Zero AI robot voices. 100% Authentic Human Qari Tilawat.")
    print("=" * 50)
    return 0


if __name__ == "__main__":
    sys.exit(main())