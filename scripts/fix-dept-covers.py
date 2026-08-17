"""Fix two mismatched/missing covers: K-ON! for music, Suzume for publicity."""
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps" / "web" / "public" / "assets" / "departments"
API = "https://graphql.anilist.co"
HEADERS = {"Content-Type": "application/json", "User-Agent": "zuoyou-guild-showcase/1.0"}

QUERY = """
query ($id: Int) {
  Media(type: ANIME, id: $id) {
    id
    title { romaji native english }
    startDate { year }
    coverImage { extraLarge }
    bannerImage
  }
}
"""

FIXES = [
    ("music", "01", 5680),      # K-ON!
    ("publicity", "03", 142838) # Suzume
]


def post(query, variables):
    body = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(API, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as fh:
        fh.write(resp.read())


for slug, stem, media_id in FIXES:
    dept_dir = OUT / slug
    m = post(QUERY, {"id": media_id})["data"]["Media"]
    cover_name = f"{stem}-cover.jpg"
    download(m["coverImage"]["extraLarge"], dept_dir / cover_name)
    banner_name = None
    if m.get("bannerImage"):
        banner_name = f"{stem}-banner.jpg"
        download(m["bannerImage"], dept_dir / banner_name)
    manifest_path = dept_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest = [e for e in manifest if e["cover"] != f"assets/departments/{slug}/{cover_name}"]
    manifest.append({
        "anilistId": m["id"],
        "query": m["title"]["romaji"],
        "title": m["title"]["native"] or m["title"]["romaji"],
        "romaji": m["title"]["romaji"],
        "year": (m.get("startDate") or {}).get("year"),
        "cover": f"assets/departments/{slug}/{cover_name}",
        "banner": f"assets/departments/{slug}/{banner_name}" if banner_name else None,
    })
    manifest.sort(key=lambda e: e["cover"])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(slug, stem, m["title"]["romaji"], "fixed")
    time.sleep(1)
