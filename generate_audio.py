import asyncio, re, sys, pathlib
import edge_tts

ROOT = pathlib.Path(__file__).parent
DATA = ROOT / "js" / "names-data.js"
OUT = ROOT / "audio"

VOICE = "ar-SA-HamedNeural"
RATE = "-15%"
WAQF = True

FIXES = {
}

args = sys.argv[1:]
FORCE = "force" in args
args = [a for a in args if a != "force"]
if args and args[0].startswith("ar-"):
    VOICE = args.pop(0)
ONLY = set()
for a in args:
    ONLY.update(x.strip() for x in a.split(",") if x.strip())

src = DATA.read_text(encoding="utf-8")

def grab(key):
    block = re.search(key + r":\s*Object\.freeze\(\[(.*?)\]\)", src, re.S).group(1)
    return [(int(i), a) for i, a in re.findall(r'id:\s*(\d+),\s*arabic:\s*"([^"]*)"', block)]

def waqf(t):
    t = re.sub(r"(\u0651)[\u064B-\u064F]$", r"\1", t)
    t = re.sub(r"[\u064B-\u064F](\u0651?)$", r"\1", t)
    return t

def clean(t):
    t = t.replace("\ufdfa", "").strip()
    if t[:1] == "\u0671":
        t = "\u0627" + t[1:]
    if WAQF:
        t = waqf(t)
    return t

async def one(sem, key, i, text):
    name = f"{key}-{i}"
    f = OUT / f"{name}.mp3"
    if f.exists() and f.stat().st_size > 0 and not FORCE and not (ONLY and name in ONLY):
        return
    if ONLY and name not in ONLY and not FORCE:
        return
    spoken = FIXES.get(name) or clean(text)
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(spoken, VOICE, rate=RATE).save(str(f))
                print("ok ", f.name)
                return
            except Exception as e:
                print("retry", f.name, e)
                await asyncio.sleep(2)
        print("FAILED", f.name)

async def main():
    OUT.mkdir(exist_ok=True)
    sem = asyncio.Semaphore(4)
    jobs = []
    for key in ("husna", "nabi"):
        for i, a in grab(key):
            jobs.append(one(sem, key, i, a))
    await asyncio.gather(*jobs)
    files = list(OUT.glob("*.mp3"))
    print(f"\nTayyar: {len(files)} files, {sum(f.stat().st_size for f in files)//1024} KB  (voice: {VOICE})")

asyncio.run(main())
