"""
株主総会会場のジオコーディング（Nominatim）+ 23区判定
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from edinetdb_shareholder_parser import TOKYO_23_WARDS, detect_ward, match_known_venue

# アプリ既存マスター（5会場）+ よく使われる東京会場
KNOWN_COORDINATES: dict[str, tuple[float, float, str]] = {
    "東京国際フォーラム": (35.6766, 139.7648, "千代田区"),
    "ホテルニューオータニ": (35.6809, 139.7340, "千代田区"),
    "東京ドーム": (35.7049, 139.7561, "文京区"),
    "ヒルトン東京": (35.6719, 139.7285, "新宿区"),
    "三井ガーデンホテル渋谷": (35.6623, 139.7027, "渋谷区"),
    "帝国ホテル": (35.6723, 139.7587, "千代田区"),
    "グランドハイアット東京": (35.6605, 139.7292, "港区"),
    "グランドニッコー東京": (35.6938, 139.7644, "千代田区"),
    "京王プラザホテル": (35.6896, 139.6996, "新宿区"),
    "東京ビッグサイト": (35.6301, 139.7944, "江東区"),
    "パレスホテル": (35.6856, 139.7600, "千代田区"),
    "ホテルメトロポリタン": (35.6986, 139.7715, "千代田区"),
    "ベルサール": (35.6994, 139.7656, "千代田区"),
    "ベルサール御茶水": (35.6994, 139.7656, "千代田区"),
    "東京駅ホテル": (35.6809, 139.7662, "千代田区"),
    "コングレスクエア": (35.6907, 139.7041, "新宿区"),
}

CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "shareholder-meeting-geocache.json"


def load_geocache() -> dict[str, dict[str, float | str]]:
    if not CACHE_PATH.exists():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_geocache(cache: dict[str, dict[str, float | str]]) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_key(query: str) -> str:
    return query.strip().lower()


def nominatim_geocode(query: str) -> Optional[tuple[float, float, str]]:
    params = urlencode(
        {
            "q": query,
            "format": "json",
            "limit": "1",
            "countrycodes": "jp",
        }
    )
    req = Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={"User-Agent": "TaxiNavExpo/1.0 (shareholder-meeting-geocode)"},
    )
    with urlopen(req, timeout=30) as res:
        data = json.loads(res.read().decode("utf-8"))
    if not data:
        return None

    item = data[0]
    lat = float(item["lat"])
    lng = float(item["lon"])
    display = item.get("display_name", "")
    ward = detect_ward(display) or ""
    return lat, lng, ward


def resolve_coordinates(
    venue_name: str,
    venue_address: str,
    ward: str,
    *,
    cache: Optional[dict[str, dict[str, float | str]]] = None,
    sleep_sec: float = 1.1,
    known_only: bool = False,
) -> Optional[tuple[float, float, str]]:
    known = match_known_venue(venue_name) or match_known_venue(venue_address)
    if known and known in KNOWN_COORDINATES:
        lat, lng, known_ward = KNOWN_COORDINATES[known]
        return lat, lng, ward or known_ward

    if known_only:
        return None

    if cache is None:
        cache = load_geocache()

    query = venue_address if "東京都" in venue_address else f"東京都 {venue_address or venue_name}"
    key = cache_key(query)
    if key in cache:
        entry = cache[key]
        return float(entry["latitude"]), float(entry["longitude"]), str(entry.get("ward") or ward)

    try:
        result = nominatim_geocode(query)
    except Exception:
        return None

    if sleep_sec > 0:
        time.sleep(sleep_sec)

    if not result:
        return None

    lat, lng, resolved_ward = result
    final_ward = ward or resolved_ward
    if not final_ward and known and known in KNOWN_COORDINATES:
        final_ward = KNOWN_COORDINATES[known][2]
    if final_ward and final_ward not in TOKYO_23_WARDS:
        return None
    if not final_ward:
        return None

    cache[key] = {"latitude": lat, "longitude": lng, "ward": final_ward}
    return lat, lng, final_ward
