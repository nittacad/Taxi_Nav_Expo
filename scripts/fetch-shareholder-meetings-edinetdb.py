#!/usr/bin/env python3
"""
EDINET DB API (edinetdb.jp) から東京都23区の株主総会を取得し CSV → アプリへ反映。

APIキー: EDINETDB_API_KEY 環境変数、または Taxi_Nav_Expo/.env.local

用法:
  python scripts/fetch-shareholder-meetings-edinetdb.py
  python scripts/fetch-shareholder-meetings-edinetdb.py --since 2026-05-01 --dry-run
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Optional

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
CSV_PATH = PROJECT_DIR / "data" / "shareholder-meetings.csv"
IMPORT_SCRIPT = SCRIPT_DIR / "import-shareholder-meetings.mjs"
META_PATH = PROJECT_DIR / "data" / "shareholder-meetings-fetch-meta.json"
ENV_LOCAL = PROJECT_DIR / ".env.local"

sys.path.insert(0, str(SCRIPT_DIR))
from edinetdb_shareholder_parser import ParsedMeeting, parse_section_item  # noqa: E402
from shareholder_meeting_geocode import (  # noqa: E402
    load_geocache,
    resolve_coordinates,
    save_geocache,
)

API_BASE = "https://edinetdb.jp/v1"


def load_api_key(explicit: str) -> str:
    if explicit:
        return explicit
    env_key = os.environ.get("EDINETDB_API_KEY") or os.environ.get("EDINET_API_KEY")
    if env_key:
        return env_key
    if ENV_LOCAL.exists():
        for line in ENV_LOCAL.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() in ("EDINETDB_API_KEY", "EDINET_API_KEY"):
                return value.strip().strip('"').strip("'")
    return ""


def parse_args() -> argparse.Namespace:
    today = date.today()
    parser = argparse.ArgumentParser(description="EDINET DB から株主総会スケジュールを取得")
    parser.add_argument("--since", default=(today - timedelta(days=90)).isoformat())
    parser.add_argument("--until", default=(today + timedelta(days=60)).isoformat())
    parser.add_argument("--api-key", default="")
    parser.add_argument("--replace", action="store_true", help="既存CSVを上書き（デフォルトはマージ）")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-geocode", action="store_true", help="座標取得をスキップ（既知会場のみ）")
    return parser.parse_args()


class EdinetDbClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": api_key})
        self.request_count = 0

    def get(self, path: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        self.request_count += 1
        res = self.session.get(f"{API_BASE}{path}", params=params or {}, timeout=60)
        if res.status_code == 403:
            payload = res.json() if res.content else {}
            raise RuntimeError(payload.get("error", {}).get("message", "Invalid API key"))
        if res.status_code == 429:
            raise RuntimeError("EDINET DB API の日次上限（100回/日）に達しました。明日再実行してください。")
        res.raise_for_status()
        return res.json()

    def search_sections(self, params: dict[str, Any]) -> list[dict[str, Any]]:
        data = self.get("/ir/sections/search", params)
        return data.get("results") or data.get("sections") or data.get("data") or []

    def search_events(self, params: dict[str, Any]) -> list[dict[str, Any]]:
        data = self.get("/events", params)
        return data.get("results") or data.get("events") or data.get("data") or []


def dedupe_key(parsed: ParsedMeeting) -> str:
    sec = (parsed.sec_code or parsed.edinet_code or "na").strip()
    return f"{sec}|{parsed.meeting_date}|{parsed.venue_name}|{parsed.start_time}"


def collect_meetings(client: EdinetDbClient, since: str, until: str) -> tuple[list[ParsedMeeting], list[str]]:
    logs: list[str] = []
    found: dict[str, ParsedMeeting] = {}

    searches = [
        {
            "label": "shareholder_meeting sections",
            "params": {
                "pdf_type": "shareholder_meeting",
                "queries": ["株主総会", "開催"],
                "queries_match": "and",
                "since": since,
                "limit": 50,
            },
        },
        {
            "label": "keyword 招集通知",
            "params": {
                "q": "株主総会招集通知",
                "since": since,
                "limit": 50,
            },
        },
        {
            "label": "keyword 東京都 開催場所",
            "params": {
                "queries": ["株主総会", "東京都"],
                "queries_match": "and",
                "since": since,
                "limit": 50,
            },
        },
    ]

    for spec in searches:
        try:
            items = client.search_sections(spec["params"])
        except Exception as exc:
            logs.append(f"  × {spec['label']}: {exc}")
            continue
        logs.append(f"  {spec['label']}: {len(items)} 件")
        for item in items:
            parsed = parse_section_item(item)
            if not parsed:
                continue
            found[dedupe_key(parsed)] = parsed

    try:
        events = client.search_events(
            {
                "event_category": "governance",
                "since": since,
                "until": until,
                "limit": 200,
            }
        )
        logs.append(f"  governance events: {len(events)} 件")
        for event in events:
            title = str(event.get("title") or event.get("event_title") or "")
            if "株主総会" not in title and "招集" not in title:
                continue
            parsed = parse_section_item(event)
            if parsed:
                found[dedupe_key(parsed)] = parsed
    except Exception as exc:
        logs.append(f"  × governance events: {exc}")

    return list(found.values()), logs


def make_row_id(parsed: ParsedMeeting) -> str:
    sec = (parsed.sec_code or parsed.edinet_code or "0000").replace(" ", "")
    return f"agm_edinetdb_{sec}_{parsed.meeting_date}"


def enrich_with_coordinates(
    meetings: list[ParsedMeeting], skip_geocode: bool
) -> tuple[list[dict[str, str]], list[str]]:
    cache = load_geocache()
    rows: list[dict[str, str]] = []
    logs: list[str] = []

    for parsed in meetings:
        coords = resolve_coordinates(
            parsed.venue_name,
            parsed.venue_address,
            parsed.ward,
            cache=cache,
            sleep_sec=0 if skip_geocode else 1.1,
            known_only=skip_geocode,
        )
        if not coords:
            logs.append(f"  スキップ（23区座標未解決）: {parsed.company_name} / {parsed.venue_name}")
            continue

        lat, lng, ward = coords
        rows.append(
            {
                "id": make_row_id(parsed),
                "company_name": parsed.company_name,
                "venue_name": parsed.venue_name,
                "venue_address": parsed.venue_address,
                "ward": ward,
                "latitude": f"{lat:.6f}",
                "longitude": f"{lng:.6f}",
                "meeting_date": parsed.meeting_date,
                "start_time": parsed.start_time,
                "participant_count": str(parsed.participant_count),
            }
        )
        logs.append(
            f"  ✓ {parsed.company_name} | {parsed.venue_name} ({ward}) | "
            f"{parsed.meeting_date} {parsed.start_time}"
        )

    if not skip_geocode:
        save_geocache(cache)
    return rows, logs


def read_existing_csv() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        return []
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(encoding="utf-8") as f:
        reader = csv.DictReader(line for line in f if line.strip() and not line.strip().startswith("#"))
        for row in reader:
            rows.append(row)
    return rows


def write_csv(rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "id",
        "company_name",
        "venue_name",
        "venue_address",
        "ward",
        "latitude",
        "longitude",
        "meeting_date",
        "start_time",
        "participant_count",
    ]
    header = (
        "# 株主総会スケジュール — EDINET DB 自動取得 + 手動追記\n"
        "# npm run import:shareholder-meetings\n"
    )
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        f.write(header)
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in sorted(rows, key=lambda r: (r["meeting_date"], r["start_time"])):
            writer.writerow({k: row.get(k, "") for k in fieldnames})


def merge_rows(existing: list[dict[str, str]], fetched: list[dict[str, str]]) -> list[dict[str, str]]:
    by_id = {r["id"]: r for r in existing}
    for row in fetched:
        by_id[row["id"]] = row
    return list(by_id.values())


def write_fetch_meta(since: str, until: str) -> None:
    import json

    META_PATH.write_text(
        json.dumps(
            {
                "rangeSince": since,
                "rangeUntil": until,
                "fetchedAt": datetime.now().isoformat(timespec="seconds"),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def run_import() -> None:
    subprocess.run(["node", str(IMPORT_SCRIPT)], cwd=str(PROJECT_DIR), check=True)


def main() -> int:
    args = parse_args()
    api_key = load_api_key(args.api_key)
    if not api_key:
        print(
            "EDINETDB_API_KEY が未設定です。\n"
            "1. https://edinetdb.jp/ の開発者ページで API キーをコピー\n"
            "2. Taxi_Nav_Expo/.env.local に EDINETDB_API_KEY=... を保存\n"
            "   または PowerShell: $env:EDINETDB_API_KEY = \"your-key\"",
            file=sys.stderr,
        )
        return 1

    print(f"EDINET DB 取得: since={args.since} until={args.until}")
    client = EdinetDbClient(api_key)

    try:
        meetings, search_logs = collect_meetings(client, args.since, args.until)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    for line in search_logs:
        print(line)
    print(f"解析候補: {len(meetings)} 件（API {client.request_count} リクエスト）")

    rows, geo_logs = enrich_with_coordinates(meetings, args.skip_geocode)
    for line in geo_logs:
        print(line)

    print(f"\n23区反映対象: {len(rows)} 件")

    if args.dry_run:
        return 0

    if not rows and not read_existing_csv():
        print("書き込むデータがありません。")
        return 0

    merged = merge_rows(read_existing_csv(), rows) if not args.replace else rows
    if merged:
        write_fetch_meta(args.since, args.until)
        write_csv(merged)
        print(f"CSV 更新: {CSV_PATH}")
        run_import()
        print("import:shareholder-meetings 完了（JSON: data/shareholder-meetings.json）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
