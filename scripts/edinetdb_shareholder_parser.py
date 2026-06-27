"""
EDINET DB API (/v1/ir/sections/search 等) のレスポンス本文から
株主総会の日時・会場を抽出するユーティリティ
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Optional

TOKYO_23_WARDS: tuple[str, ...] = (
    "千代田区",
    "中央区",
    "港区",
    "新宿区",
    "文京区",
    "台東区",
    "墨田区",
    "江東区",
    "品川区",
    "目黒区",
    "大田区",
    "世田谷区",
    "渋谷区",
    "中野区",
    "杉並区",
    "豊島区",
    "北区",
    "荒川区",
    "板橋区",
    "練馬区",
    "足立区",
    "葛飾区",
    "江戸川区",
)

KNOWN_VENUE_ALIASES: dict[str, str] = {
    "東京国際フォーラム": "東京国際フォーラム",
    "ホテルニューオータニ": "ホテルニューオータニ",
    "ニューオータニ": "ホテルニューオータニ",
    "東京ドーム": "東京ドーム",
    "ヒルトン東京": "ヒルトン東京",
    "三井ガーデンホテル渋谷": "三井ガーデンホテル渋谷",
    "三井ガーデンホテル": "三井ガーデンホテル渋谷",
    "帝国ホテル": "帝国ホテル",
    "グランドハイアット東京": "グランドハイアット東京",
    "グランドニッコー東京": "グランドニッコー東京",
    "京王プラザホテル": "京王プラザホテル",
    "ベルサール": "ベルサール",
    "東京ビッグサイト": "東京ビッグサイト",
    "パレスホテル": "パレスホテル",
    "ホテルメトロポリタン": "ホテルメトロポリタン",
}


@dataclass
class ParsedMeeting:
    company_name: str
    venue_name: str
    venue_address: str
    ward: str
    meeting_date: str
    start_time: str
    participant_count: int
    source_id: str
    edinet_code: Optional[str] = None
    sec_code: Optional[str] = None


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def match_known_venue(text: str) -> Optional[str]:
    for key, canonical in KNOWN_VENUE_ALIASES.items():
        if key in text:
            return canonical
    return None


def detect_ward(text: str) -> Optional[str]:
    for ward in TOKYO_23_WARDS:
        if ward in text:
            return ward
    return None


def is_tokyo_23_ward_meeting(text: str) -> bool:
    if detect_ward(text):
        return True
    if match_known_venue(text):
        return True
    if "東京都" in text and any(w.replace("区", "") in text for w in TOKYO_23_WARDS):
        return True
    return False


def parse_meeting_datetime(text: str) -> Optional[tuple[str, str]]:
    patterns = [
        r"(\d{4})年(\d{1,2})月(\d{1,2})日[^\d]{0,24}?(\d{1,2})[:：](\d{2})",
        r"(\d{4})年(\d{1,2})月(\d{1,2})日[^\d]{0,24}?(\d{1,2})時(\d{1,2})分",
        r"(\d{4})/(\d{1,2})/(\d{1,2})[^\d]{0,12}?(\d{1,2}):(\d{2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        y, mo, d, h, mi = match.groups()
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}", f"{int(h):02d}:{int(mi):02d}"
    return None


def parse_venue_address(text: str) -> tuple[str, str, str]:
    """Returns (venue_name, venue_address, ward)"""
    known = match_known_venue(text)
    ward = detect_ward(text)

    venue_patterns = [
        r"開催場所[：:\s]*([^。\n]{8,120})",
        r"会場[：:\s]*([^。\n]{8,120})",
        r"(東京都[^。\n]{8,120}?(?:ホール|会館|ドーム|ホテル|フォーラム|センター|ビル|タワー|会議室))",
    ]
    raw_snippet = ""
    for pattern in venue_patterns:
        match = re.search(pattern, text)
        if match:
            raw_snippet = normalize_whitespace(match.group(1))
            break

    if not raw_snippet and known:
        raw_snippet = known

    venue_name = known or raw_snippet[:40] or "会場未特定"
    address = raw_snippet or venue_name
    if not ward:
        ward = detect_ward(address) or detect_ward(text) or ""

    return venue_name, address, ward


def estimate_participant_count(venue_name: str, body: str) -> int:
    count_match = re.search(r"(?:株主|参加者|出席)[^\d]{0,12}?(\d{1,3}(?:,\d{3})*|\d+)\s*名", body)
    if count_match:
        raw = count_match.group(1).replace(",", "")
        try:
            value = int(raw)
            if value > 0:
                return value
        except ValueError:
            pass

    large_venues = ("東京ドーム", "東京国際フォーラム", "東京ビッグサイト", "ベルサール")
    if any(v in venue_name for v in large_venues):
        return 5000
    if "ホテル" in venue_name or "フォーラム" in venue_name:
        return 2500
    return 1200


def extract_company_name(item: dict[str, Any]) -> str:
    for key in ("company_name", "filer_name", "name", "companyName"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.replace("株式会社", "").strip()
    return "不明"


def extract_section_text(item: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in ("heading", "body", "title", "description", "summary", "event_title"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value)
    return normalize_whitespace(" ".join(parts))


def parse_section_item(item: dict[str, Any]) -> Optional[ParsedMeeting]:
    text = extract_section_text(item)
    if not text or "株主総会" not in text and "招集通知" not in text:
        return None
    if not is_tokyo_23_ward_meeting(text):
        return None

    dt = parse_meeting_datetime(text)
    if not dt:
        return None

    meeting_date, start_time = dt
    venue_name, venue_address, ward = parse_venue_address(text)
    if not ward and not match_known_venue(text):
        return None

    company = extract_company_name(item)
    source_id = str(item.get("section_id") or item.get("id") or item.get("event_id") or "unknown")

    return ParsedMeeting(
        company_name=company,
        venue_name=venue_name,
        venue_address=venue_address,
        ward=ward,
        meeting_date=meeting_date,
        start_time=start_time,
        participant_count=estimate_participant_count(venue_name, text),
        source_id=source_id,
        edinet_code=item.get("edinet_code") or item.get("company_code"),
        sec_code=item.get("sec_code"),
    )
