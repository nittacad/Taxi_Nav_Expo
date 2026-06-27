"""edinetdb_shareholder_parser のユニットテスト"""

import unittest

from edinetdb_shareholder_parser import (
    detect_ward,
    is_tokyo_23_ward_meeting,
    parse_meeting_datetime,
    parse_section_item,
    parse_venue_address,
)

SAMPLE_BODY = """
第50回定時株主総会招集通知
開催日時：2026年6月25日 10時00分
開催場所：東京都千代田区丸の内3丁目5番1号 東京国際フォーラム ホールA
"""


class TestEdinetDbParser(unittest.TestCase):
    def test_parse_datetime(self):
        dt = parse_meeting_datetime(SAMPLE_BODY)
        self.assertEqual(dt, ("2026-06-25", "10:00"))

    def test_detect_ward(self):
        self.assertEqual(detect_ward("東京都千代田区丸の内"), "千代田区")

    def test_parse_venue(self):
        name, address, ward = parse_venue_address(SAMPLE_BODY)
        self.assertEqual(name, "東京国際フォーラム")
        self.assertEqual(ward, "千代田区")
        self.assertIn("千代田区", address)

    def test_tokyo_filter(self):
        self.assertTrue(is_tokyo_23_ward_meeting(SAMPLE_BODY))
        self.assertFalse(is_tokyo_23_ward_meeting("大阪府大阪市で開催"))

    def test_parse_section_item(self):
        item = {
            "company_name": "株式会社テスト",
            "heading": "株主総会招集通知",
            "body": SAMPLE_BODY,
            "edinet_code": "E00001",
            "sec_code": "9999",
            "section_id": "sec_1",
        }
        parsed = parse_section_item(item)
        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.meeting_date, "2026-06-25")
        self.assertEqual(parsed.venue_name, "東京国際フォーラム")


if __name__ == "__main__":
    unittest.main()
