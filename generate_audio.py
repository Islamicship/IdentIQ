#!/usr/bin/env python3
"""Asma-ul-Husna / Nabi audio generator (edge-tts) - robust build version.

Usage (purana CLI bhi chalta hai):
    python generate_audio.py                      # sirf missing / badli hui files
    python generate_audio.py husna-1,nabi-5       # in files ko dobara banao
    python generate_audio.py --force              # sab dobara
    python generate_audio.py ar-SA-ZariyahNeural  # voice badlo
    python generate_audio.py --concurrency 2 --delay 0.5

Exit code: 0 = sab theek, 1 = koi file fail / abort, 130 = Ctrl+C.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import random
import re
import sys
import time
from pathlib import Path

try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts missing hai:  pip install -U edge-tts")

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "js" / "names-data.js"
OUT = ROOT / "audio"
MANIFEST = OUT / ".manifest.json"
KEYS = ("husna", "nabi")

DEFAULT_VOICE = "ar-SA-HamedNeural"
DEFAULT_RATE = "-15%"
WAQF = True

MIN_BYTES = 1024           # isse chhoti mp3 = corrupt
REQUEST_TIMEOUT = 45       # seconds per request
MAX_CONSECUTIVE_FAILS = 6  # itni lagatar failures par poora run abort (ban se bachav)

# Kisi khaas naam ka custom talaffuz: {"husna-5": "..."}
FIXES: dict[str, str] = {}


# --------------------------------------------------------------------------- #
# Text helpers
# --------------------------------------------------------------------------- #
def grab(src: str, key: str) -> list[tuple[int, str]]:
    m = re.search(rf"{key}:\s*Object\.freeze\(\[(.*?)\]\)", src, re.S)
    if not m:
        raise SystemExit(f"'{key}' block {DATA} mein nahi mila (format badla?)")
    items = [(int(i), a) for i, a in
             re.findall(r'id:\s*(\d+),\s*arabic:\s*"([^"]*)"', m.group(1))]
    if not items:
        raise SystemExit(f"'{key}' block mila lekin koi entry parse nahi hui")
    ids = [i for i, _ in items]
    if len(ids) != len(set(ids)):
        raise SystemExit(f"'{key}' mein duplicate id hain")
    return items


def waqf(t: str) -> str:
    t = re.sub(r"(\u0651)[\u064B-\u064F]$", r"\1", t)
    t = re.sub(r"[\u064B-\u064F](\u0651?)$", r"\1", t)
    return t


def clean(t: str, use_waqf: bool) -> str:
    t = t.replace("\ufdfa", "").strip()
    if t[:1] == "\u0671":
        t = "\u0627" + t[1:]
    return waqf(t) if use_waqf else t


# --------------------------------------------------------------------------- #
# File helpers
# --------------------------------------------------------------------------- #
def valid_mp3(path: Path) -> bool:
    """Size + header check: ID3 tag ya MPEG frame sync (0xFFEx)."""
    try:
        if path.stat().st_size < MIN_BYTES:
            return False
        with path.open("rb") as fh:
            h = fh.read(3)
    except OSError:
        return False
    return h == b"ID3" or (len(h) >= 2 and h[0] == 0xFF and (h[1] & 0xE0) == 0xE0)


def atomic_write_text(path: Path, text: str) -> None:
    tmp = path.with_name(f"{path.name}.{os.getpid()}.part")
    try:
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)  # Windows + POSIX dono par atomic
    finally:
        tmp.unlink(missing_ok=True)


def load_manifest() -> dict[str, str]:
    try:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_manifest(m: dict[str, str]) -> None:
    atomic_write_text(MANIFEST, json.dumps(m, indent=0, sort_keys=True))


async def synth_atomic(text: str, voice: str, rate: str, dest: Path) -> None:
    """Pehle .part mein likho, verify karo, phir os.replace. Final file kabhi half nahi hoti."""
    tmp = dest.with_name(f"{dest.name}.{os.getpid()}.part")
    try:
        await asyncio.wait_for(
            edge_tts.Communicate(text, voice, rate=rate).save(str(tmp)),
            timeout=REQUEST_TIMEOUT,
        )
        if not valid_mp3(tmp):
            raise OSError("generated mp3 invalid/chhoti hai")
        os.replace(tmp, dest)
    finally:
        tmp.unlink(missing_ok=True)


# --------------------------------------------------------------------------- #
# Throttling + workers
# --------------------------------------------------------------------------- #
class Throttle:
    """Requests ke beech minimum gap; rate-limit milne par sab workers ruk jaate hain."""

    def __init__(self, min_interval: float):
        self.min_interval = min_interval
        self._next = 0.0
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        async with self._lock:
            now = time.monotonic()
            delay = max(0.0, self._next - now)
            self._next = max(now, self._next) + self.min_interval
        if delay:
            await asyncio.sleep(delay)

    def penalize(self, seconds: float) -> None:
        self._next = max(self._next, time.monotonic() + seconds)


class Ctx:
    def __init__(self, voice, rate, retries, throttle, manifest):
        self.voice, self.rate, self.retries = voice, rate, retries
        self.throttle, self.manifest = throttle, manifest
        self.abort = False
        self.consecutive_fails = 0
        self.ok = 0
        self.failed: list[str] = []


async def process(job: tuple[str, str, str], ctx: Ctx) -> None:
    name, spoken, digest = job
    dest = OUT / f"{name}.mp3"
    for attempt in range(1, ctx.retries + 1):
        if ctx.abort:
            return
        await ctx.throttle.wait()
        try:
            await synth_atomic(spoken, ctx.voice, ctx.rate, dest)
        except ValueError as e:  # galat voice/rate: retry ka faida nahi
            print(f"FATAL {name}: {e}", file=sys.stderr)
            ctx.abort = True
            ctx.failed.append(name)
            return
        except Exception as e:  # network, timeout, 403/429, disk, NoAudioReceived...
            status = getattr(e, "status", None)
            delay = min(60.0, 2.0 ** attempt) + random.uniform(0, 1)
            if status in (403, 429, 503):
                delay = max(delay, 20.0 * attempt)
                ctx.throttle.penalize(delay)  # sab workers ruko
            print(f"retry {name} ({attempt}/{ctx.retries}) in {delay:.0f}s: "
                  f"{type(e).__name__}: {e}")
            if attempt < ctx.retries:
                await asyncio.sleep(delay)
            continue
        ctx.consecutive_fails = 0
        ctx.manifest[name] = digest
        ctx.ok += 1
        print("ok ", dest.name)
        return

    ctx.failed.append(name)
    ctx.consecutive_fails += 1
    print("FAILED", dest.name, file=sys.stderr)
    if ctx.consecutive_fails >= MAX_CONSECUTIVE_FAILS:
        print("Lagatar failures - shayad block/ban. Run abort kar raha hoon; "
              "thodi der baad dobara chalao.", file=sys.stderr)
        ctx.abort = True


async def worker(queue: asyncio.Queue, ctx: Ctx) -> None:
    while not ctx.abort:
        try:
            job = queue.get_nowait()
        except asyncio.QueueEmpty:
            return
        await process(job, ctx)


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def parse_args():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("targets", nargs="*",
                   help="husna-1,nabi-3  |  ar-XX-VoiceName  |  force")
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--rate", default=DEFAULT_RATE)
    p.add_argument("--force", action="store_true")
    p.add_argument("--no-waqf", action="store_true")
    p.add_argument("--concurrency", type=int, default=2)
    p.add_argument("--delay", type=float, default=0.3,
                   help="do requests ke beech minimum gap (sec)")
    p.add_argument("--retries", type=int, default=4)
    a = p.parse_args()

    only: set[str] = set()
    for t in a.targets:  # purane CLI se compatibility
        if t == "force":
            a.force = True
        elif t.startswith("ar-"):
            a.voice = t
        else:
            only.update(x.strip() for x in t.split(",") if x.strip())
    a.only = only
    a.concurrency = max(1, a.concurrency)
    a.retries = max(1, a.retries)
    return a


async def run(a) -> int:
    try:
        src = DATA.read_text(encoding="utf-8")
    except OSError as e:
        print(f"{DATA} padh nahi saka: {e}", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.part"):  # pichhle crash ka kachra
        stale.unlink(missing_ok=True)

    manifest = load_manifest()
    entries = [(f"{k}-{i}", text) for k in KEYS for i, text in grab(src, k)]
    known = {n for n, _ in entries}
    for unknown in sorted(a.only - known):
        print(f"warning: '{unknown}' naam data mein nahi hai", file=sys.stderr)

    jobs = []
    for name, text in entries:
        if a.only and name not in a.only:
            continue
        spoken = FIXES.get(name) or clean(text, WAQF and not a.no_waqf)
        if not spoken:
            print(f"skip {name}: khali text", file=sys.stderr)
            continue
        digest = hashlib.sha1(f"{a.voice}|{a.rate}|{spoken}".encode()).hexdigest()
        dest = OUT / f"{name}.mp3"
        explicit = name in a.only
        # manifest mein entry nahi (purani file) -> adopt; entry hai par alag -> stale
        fresh = valid_mp3(dest) and manifest.get(name, digest) == digest
        if fresh and not a.force and not explicit:
            manifest.setdefault(name, digest)
            continue
        jobs.append((name, spoken, digest))

    print(f"{len(jobs)} file(s) banani hain, {len(entries) - len(jobs)} skip "
          f"(voice: {a.voice}, rate: {a.rate})")

    ctx = Ctx(a.voice, a.rate, a.retries, Throttle(a.delay), manifest)
    queue: asyncio.Queue = asyncio.Queue()
    for j in jobs:
        queue.put_nowait(j)

    try:
        await asyncio.gather(*(worker(queue, ctx) for _ in range(a.concurrency)))
    finally:
        save_manifest(manifest)  # Ctrl+C par bhi progress bachti hai

    good = [n for n, _ in entries if valid_mp3(OUT / f"{n}.mp3")]
    size_kb = sum((OUT / f"{n}.mp3").stat().st_size for n in good) // 1024
    print(f"\nTayyar: {len(good)}/{len(entries)} files, {size_kb} KB  (voice: {a.voice})")
    if ctx.failed or ctx.abort:
        print("Fail:", ", ".join(ctx.failed) or "-", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    a = parse_args()
    try:
        return asyncio.run(run(a))
    except KeyboardInterrupt:
        print("\nInterrupt - progress save ho gaya.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
