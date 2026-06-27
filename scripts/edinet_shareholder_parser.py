"""
EDINET 提出書類（XBRL/HTML）から株主総会の日時・会場を抽出するユーティリティ
"""

from __future__ import annotations

import io
import re
import zipfile
from dataclasses import dataclass
from html import unescape
from typing import Optional

# アプリ側会場マスターと名前マッチング
KNOWN_VENUES: dict[str, str] = {
    "東京国際フォーラム": "東京国際フォーラム",
    "ホテルニューオータニ": "ホテルニューオータニ",
    "ニューオータニ": "ホテルニューオータニ",
    "東京ドーム": "東京ドーム",
    "ヒルトン東京": "ヒルトン東京",
    "三井ガーデンホテル": "三井ガーデンホテル渋谷",
    "三井ガーデンホテル渋谷": "三井ガーデンホテル渋谷",
}

DEFAULT_PARTICIPANT_BY_VENUE: dict[str, int] = {
    "東京国際フォーラム": 5000,
    "ホテルニューオータニ": 3000,
    "東京ドーム": 10000,
    "ヒルトン東京": 2000,
    "三井ガーデンホテル渋谷": 1500,
}


@dataclass
class ParsedShareholderMeeting:
    company_name: str
    venue_name: str
    meeting_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    participant_count: int
    raw_venue: str
    doc_id: str
    sec_code: Optional[str]


def strip_html(raw: str) -> str:
    text = re.sub(r"<script[^>]*>.*?</script>", " ", raw, flags=re.I | re.S)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text


def extract_text_from_zip(zip_bytes: bytes) -> str:
    chunks: list[str] = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            lower = name.lower()
            if not lower.endswith((".htm", ".html", ".xbrl", ".xml", ".txt")):
                continue
            try:
                raw = zf.read(name).decode("utf-8", errors="ignore")
            except Exception:
                continue
            chunks.append(strip_html(raw))
    return " ".join(chunks)


def match_known_venue(text: str) -> Optional[str]:
    for key, canonical in KNOWN_VENUES.items():
        if key in text:
            return canonical
    return None


def parse_meeting_datetime(text: str) -> Optional[tuple[str, str]]:
    """Returns (YYYY-MM-DD, HH:MM)"""
    patterns = [
        r"(\d{4})年(\d{1,2})月(\d{1,2})日[^\d]{0,20}?(\d{1,2})[:：](\d{2})",
        r"(\d{4})年(\d{1,2})月(\d{1,2})日[^\d]{0,20}?(\d{1,2})時(\d{1,2})分",
        r"(\d{4})/(\d{1,2})/(\d{1,2})[^\d]{0,10}?(\d{1,2}):(\d{2})",
    ]
    for pattern in patterns:
        m = re.search(pattern, text)
        if not m:
            continue
        y, mo, d, h, mi = m.groups()
        date = f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
        time = f"{int(h):02d}:{int(mi):02d}"
        return date, time
    return None


def parse_tokyo_venue_snippet(text: str) -> Optional[str]:
    """東京都内の会場らしい文字列を抽出"""
    known = match_known_venue(text)
    if known:
        return known
    if "東京都" not in text and "東京" not in text:
        return None

    venue_patterns = [
        r"(東京都[^。\n]{5,120}?(?:ホール|会館|ドーム|ホテル|フォーラム|センター|ビル|タワー))",
        r"((?:ホテル|東京)[^\s。\n]{2,40}(?:ホテル|フォーラム|ドーム|会館))",
    ]
    for pattern in venue_patterns:
        m = re.search(pattern, text)
        if m:
            snippet = m.group(1).strip()
            canonical = match_known_venue(snippet)
            return canonical or snippet[:80]
    return match_known_venue(text)


def parse_shareholder_meeting_from_zip(
    zip_bytes: bytes,
    *,
    company_name: str,
    doc_id: str,
    sec_code: Optional[str],
    fallback_date: Optional[str] = None,
) -> Optional[ParsedShareholderMeeting]:
    text = extract_text_from_zip(zip_bytes)
    if "株主総会" not in text and "総会" not in text:
        return None

    dt = parse_meeting_datetime(text)
    if not dt and fallback_date:
        dt = (fallback_date, "10:00")
    if not dt:
        return None

    meeting_date, start_time = dt
    raw_venue = parse_tokyo_venue_snippet(text)
    if not raw_venue:
        return None

    venue_name = match_known_venue(raw_venue) or raw_venue
    # 東京都外を除外（主要5会場以外で都名が無い場合は東京キーワード必須）
    if venue_name not in DEFAULT_PARTICIPANT_BY_VENUE:
        if "東京" not in raw_venue and "東京都" not in text[:5000]:
            return None

    participant = DEFAULT_PARTICIPANT_BY_VENUE.get(venue_name, 1000)

    return ParsedShareholderMeeting(
        company_name=company_name.replace("株式会社", "").strip() or company_name,
        venue_name=venue_name if venue_name in DEFAULT_PARTICIPANT_BY_VENUE else venue_name[:40],
        meeting_date=meeting_date,
        start_time=start_time,
        participant_count=participant,
        raw_venue=raw_venue,
        doc_id=doc_id,
        sec_code=sec_code,
    )


def is_shareholder_meeting_doc(doc_description: str) -> bool:
    keywords = ("株主総会", "招集通知", "総会参考書面", "議決権行使")
    return any(k in doc_description for k in keywords)
