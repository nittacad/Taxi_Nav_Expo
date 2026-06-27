#!/usr/bin/env python3
"""
EDINET API v2 から東京都の株主総会情報を取得し、shareholder-meetings.csv を更新する。

事前準備:
  1. https://disclosure.edinet-fsa.go.jp/ で API キー（Subscription-Key）を無料取得
  2. 環境変数 EDINET_API_KEY に設定

用法:
  python scripts/fetch-shareholder-meetings-edinet.py
  python scripts/fetch-shareholder-meetings-edinet.py --from 2026-06-20 --to 2026-06-30
  python scripts/fetch-shareholder-meetings-edinet.py --replace  # 既存CSVを上書き
  python scripts/fetch-shareholder-meetings-edinet.py --dry-run

取得後（自動）:
  node scripts/import-shareholder-meetings.mjs
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
CSV_PATH = PROJECT_DIR / "data" / "shareholder-meetings.csv"
IMPORT_SCRIPT = SCRIPT_DIR / "import-shareholder-meetings.mjs"

sys.path.insert(0, str(SCRIPT_DIR))
from edinet_shareholder_parser import (  # noqa: E402
    DEFAULT_PARTICIPANT_BY_VENUE,
    ParsedShareholderMeeting,
    is_shareholder_meeting_doc,
    parse_shareholder_meeting_from_zip,
)

API_BASE = "https://api.edinet-fsa.go.jp/api/v2"
REQUEST_INTERVAL_SEC = 0.6


def parse_args() -> argparse.Namespace:
    today = date.today()
    default_from = date(today.year, 6, 15)
    default_to = date(today.year, 6, 30)

    parser = argparse.ArgumentParser(description="EDINET から株主総会スケジュールを取得")
    parser.add_argument("--from", dest="from_date", default=default_from.isoformat())
    parser.add_argument("--to", dest="to_date", default=default_to.isoformat())
    parser.add_argument("--api-key", default=os.environ.get("EDINET_API_KEY", ""))
    parser.add_argument(
        "--replace",
        action="store_true",
        help="既存 CSV を上書き（デフォルトは id でマージ）",
    )
    parser.add_argument("--dry-run", action="store_true", help="CSV 書き込み・import をスキップ")
    parser.add_argument("--max-docs", type=int, default=80, help="XBRL 解析の上限件数/日")
    return parser.parse_args()


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def fetch_documents(api_key: str, day: date) -> list[dict]:
    url = f"{API_BASE}/documents.json"
    params = {"date": day.isoformat(), "type": "2", "Subscription-Key": api_key}
    res = requests.get(url, params=params, timeout=60)
    if res.status_code == 401:
        raise RuntimeError(
            "EDINET API キーが無効です。EDINET_API_KEY を設定してください。"
            "（https://disclosure.edinet-fsa.go.jp/ で無料取得）"
        )
    res.raise_for_status()
    data = res.json()
    if isinstance(data, dict) and data.get("StatusCode") == 401:
        raise RuntimeError(data.get("message", "EDINET API 認証エラー"))
    return data.get("results") or []


def download_document_zip(api_key: str, doc_id: str) -> Optional[bytes]:
    url = f"{API_BASE}/documents/{doc_id}"
    params = {"type": "1", "Subscription-Key": api_key}
    res = requests.get(url, params=params, timeout=120)
    if res.status_code != 200:
        return None
    content_type = res.headers.get("Content-Type", "")
    if "json" in content_type and res.content[:1] == b"{":
        return None
    return res.content


def make_meeting_id(parsed: ParsedShareholderMeeting) -> str:
    sec = (parsed.sec_code or "0000").strip() or "0000"
    return f"agm_edinet_{sec}_{parsed.meeting_date}"


def to_csv_row(parsed: ParsedShareholderMeeting) -> dict[str, str]:
    return {
        "id": make_meeting_id(parsed),
        "company_name": parsed.company_name,
        "venue_name": parsed.venue_name,
        "meeting_date": parsed.meeting_date,
        "start_time": parsed.start_time,
        "participant_count": str(parsed.participant_count),
    }


def read_existing_csv() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        return []
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(encoding="utf-8") as f:
        reader = csv.DictReader(
            line for line in f if line.strip() and not line.strip().startswith("#")
        )
        for row in reader:
            rows.append(row)
    return rows


def write_csv(rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "id",
        "company_name",
        "venue_name",
        "meeting_date",
        "start_time",
        "participant_count",
    ]
    header = (
        "# 株主総会スケジュール — EDINET 自動取得 + 手動追記\n"
        "# npm run import:shareholder-meetings\n"
        f"# 生成: {datetime.now().isoformat(timespec='seconds')}\n"
    )
    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        f.write(header)
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in sorted(rows, key=lambda r: (r["meeting_date"], r["start_time"])):
            writer.writerow({k: row[k] for k in fieldnames})


def merge_rows(existing: list[dict], fetched: list[dict]) -> list[dict]:
    by_id = {r["id"]: r for r in existing}
    for row in fetched:
        by_id[row["id"]] = row
    return list(by_id.values())


def collect_meetings(
    api_key: str, from_date: date, to_date: date, max_docs_per_day: int
) -> tuple[list[dict], list[str]]:
    fetched: list[dict] = []
    logs: list[str] = []
    seen_doc: set[str] = set()

    for day in daterange(from_date, to_date):
        logs.append(f"--- {day.isoformat()} ---")
        try:
            docs = fetch_documents(api_key, day)
        except Exception as exc:
            logs.append(f"  一覧取得失敗: {exc}")
            continue
        time.sleep(REQUEST_INTERVAL_SEC)

        candidates = [
            d
            for d in docs
            if is_shareholder_meeting_doc(d.get("docDescription") or "")
            and d.get("xbrlFlag") == "1"
        ]
        logs.append(f"  株主総会関連 {len(candidates)} 件（XBRLあり）")

        for doc in candidates[:max_docs_per_day]:
            doc_id = doc.get("docID")
            if not doc_id or doc_id in seen_doc:
                continue
            seen_doc.add(doc_id)

            zip_bytes = download_document_zip(api_key, doc_id)
            time.sleep(REQUEST_INTERVAL_SEC)
            if not zip_bytes:
                logs.append(f"  DL失敗: {doc_id}")
                continue

            parsed = parse_shareholder_meeting_from_zip(
                zip_bytes,
                company_name=doc.get("filerName") or "不明",
                doc_id=doc_id,
                sec_code=doc.get("secCode"),
                fallback_date=day.isoformat(),
            )
            if not parsed:
                continue

            # 会場マスター5件に限定（通知連携済み会場のみ）
            if parsed.venue_name not in DEFAULT_PARTICIPANT_BY_VENUE:
                # マッチした canonical 名に正規化
                from edinet_shareholder_parser import match_known_venue

                canonical = match_known_venue(parsed.raw_venue)
                if not canonical:
                    logs.append(
                        f"  スキップ（未対応会場）: {parsed.company_name} / {parsed.raw_venue[:40]}"
                    )
                    continue
                parsed.venue_name = canonical

            row = to_csv_row(parsed)
            fetched.append(row)
            logs.append(
                f"  ✓ {row['company_name']} | {row['venue_name']} | {row['meeting_date']} {row['start_time']}"
            )

    return fetched, logs


def run_import() -> None:
    subprocess.run(["node", str(IMPORT_SCRIPT)], cwd=str(PROJECT_DIR), check=True)


def main() -> int:
    args = parse_args()
    if not args.api_key:
        print(
            "EDINET_API_KEY が未設定です。\n"
            "1. https://disclosure.edinet-fsa.go.jp/ で API キーを取得\n"
            "2. set EDINET_API_KEY=your-key  (Windows)\n"
            "   export EDINET_API_KEY=your-key  (Mac/Linux)",
            file=sys.stderr,
        )
        return 1

    from_date = date.fromisoformat(args.from_date)
    to_date = date.fromisoformat(args.to_date)

    print(f"EDINET 取得: {from_date} 〜 {to_date}")
    fetched, logs = collect_meetings(args.api_key, from_date, to_date, args.max_docs)

    for line in logs:
        print(line)

    print(f"\n抽出成功: {len(fetched)} 件")

    if args.dry_run:
        return 0

    rows = merge_rows(read_existing_csv(), fetched) if not args.replace else fetched

    if not rows:
        print("書き込むデータがありません（期間を広げるか --max-docs を増やしてください）")
        return 0

    write_csv(rows)
    print(f"CSV 更新: {CSV_PATH}")

    run_import()
    print("import:shareholder-meetings 完了")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
