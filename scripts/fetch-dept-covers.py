"""Crawl curated anime covers/banners from AniList for department showcase pages.

Each department gets a thematically matched set of anime works.
Output: apps/web/public/assets/departments/<slug>/NNN-cover.jpg + manifest entry.
"""
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "apps" / "web" / "public" / "assets" / "departments"

API = "https://graphql.anilist.co"
HEADERS = {"Content-Type": "application/json", "User-Agent": "zuoyou-guild-showcase/1.0"}

# (search query, note) per department slug
CURATED: dict[str, list[str]] = {
    "publicity": [  # 电影院 + 藤本树黑白漫画感
        "Chainsaw Man",
        "Look Back",
        "Goodbye, Eri",
        "Attack on Titan",
        "Demon Slayer: Kimetsu no Yaiba",
        "Jujutsu Kaisen",
        "SPY x FAMILY",
        "Frieren: Beyond Journey's End",
        "Your Name.",
        "Spirited Away",
        "ONE PIECE",
        "Violet Evergarden",
    ],
    "tech": [  # 相机 / 摄影感
        "Tamayura",
        "Tada Never Falls in Love",
        "Just Because!",
        "A Silent Voice",
        "Weathering with You",
        "The Garden of Words",
        "5 Centimeters Per Second",
        "Violet Evergarden",
    ],
    "original": [  # 可爱绘画 / 创作
        "Blue Period",
        "Monthly Girls' Nozaki-kun",
        "SHIROBAKO",
        "Honey and Clover",
        "The Pet Girl of Sakurasou",
        "Keep Your Hands Off Eizouken!",
    ],
    "dance": [  # 活力 / 舞台
        "Welcome to the Ballroom",
        "Love Live! School Idol Project",
        "Zombie Land Saga",
        "Yuri!!! on Ice",
        "The iDOLM@STER",
        "Hibike! Euphonium",
    ],
    "cos": [  # 变化 / 蜕变
        "My Dress-Up Darling",
        "2.5 Dimensional Seduction",
        "Kiss Him, Not Me",
        "Wotakoi: Love is Hard for Otaku",
        "The Disastrous Life of Saiki K.",
        "Fruits Basket",
    ],
    "music": [  # 轻音 / 歌词滚动
        "K-ON!",
        "Bocchi the Rock!",
        "BanG Dream!",
        "Given",
        "Your Lie in April",
        "Carole & Tuesday",
    ],
}

QUERY = """
query ($search: String) {
  Page(page: 1, perPage: 3) {
    media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
      id
      title { romaji native english }
      startDate { year }
      coverImage { extraLarge }
      bannerImage
    }
  }
}
"""


def post(query: str, variables: dict) -> dict:
    body = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(API, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as fh:
            fh.write(resp.read())
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  !! download failed {url}: {exc}")
        return False


def main() -> None:
    for slug, queries in CURATED.items():
        dept_dir = OUT / slug
        dept_dir.mkdir(parents=True, exist_ok=True)
        manifest = []
        for idx, search in enumerate(queries, 1):
            try:
                data = post(QUERY, {"search": search})
                media = data["data"]["Page"]["media"]
                if not media:
                    print(f"[{slug}] no result for {search!r}")
                    continue
                m = media[0]
            except Exception as exc:  # noqa: BLE001
                print(f"[{slug}] query failed {search!r}: {exc}")
                time.sleep(3)
                continue
            stem = f"{idx:02d}"
            cover_name = f"{stem}-cover.jpg"
            ok = download(m["coverImage"]["extraLarge"], dept_dir / cover_name)
            banner_name = None
            if m.get("bannerImage"):
                banner_name = f"{stem}-banner.jpg"
                download(m["bannerImage"], dept_dir / banner_name)
            if ok:
                manifest.append(
                    {
                        "anilistId": m["id"],
                        "query": search,
                        "title": m["title"]["native"] or m["title"]["romaji"],
                        "romaji": m["title"]["romaji"],
                        "year": (m.get("startDate") or {}).get("year"),
                        "cover": f"assets/departments/{slug}/{cover_name}",
                        "banner": f"assets/departments/{slug}/{banner_name}" if banner_name else None,
                    }
                )
                print(f"[{slug}] {stem} {m['title']['romaji']} ok")
            time.sleep(1.2)  # be polite with rate limits
        (dept_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print("done")


if __name__ == "__main__":
    main()
