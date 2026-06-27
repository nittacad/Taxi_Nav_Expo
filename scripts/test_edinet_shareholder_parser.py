"""edinet_shareholder_parser のユニットテスト"""

import unittest

from edinet_shareholder_parser import (
    is_shareholder_meeting_doc,
    match_known_venue,
    parse_meeting_datetime,
    parse_shareholder_meeting_from_zip,
    parse_tokyo_venue_snippet,
    strip_html,
)

SAMPLE_HTML = """
<html><body>
<h1>第50回定時株主総会招集通知</h1>
<p>開催日時：2026年6月25日 10時00分</p>
<p>開催場所：東京都千代田区丸の内3丁目5番1号 東京国際フォーラム ホールA</p>
</body></html>
"""


class TestEdinetParser(unittest.TestCase):
    def test_strip_html(self):
        self.assertIn("株主総会", strip_html(SAMPLE_HTML))

    def test_is_shareholder_meeting_doc(self):
        self.assertTrue(is_shareholder_meeting_doc("臨時報告書（株主総会招集通知）"))
        self.assertFalse(is_shareholder_meeting_doc("有価証券報告書"))

    def test_parse_meeting_datetime(self):
        text = strip_html(SAMPLE_HTML)
        dt = parse_meeting_datetime(text)
        self.assertEqual(dt, ("2026-06-25", "10:00"))

    def test_match_known_venue(self):
        self.assertEqual(match_known_venue("東京国際フォーラム ホールA"), "東京国際フォーラム")

    def test_parse_tokyo_venue(self):
        text = strip_html(SAMPLE_HTML)
        venue = parse_tokyo_venue_snippet(text)
        self.assertEqual(venue, "東京国際フォーラム")

    def test_parse_from_zip(self):
        import io
        import zipfile

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("PublicDoc.htm", SAMPLE_HTML)
        parsed = parse_shareholder_meeting_from_zip(
            buf.getvalue(),
            company_name="株式会社テスト",
            doc_id="S100TEST",
            sec_code="1234",
        )
        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.meeting_date, "2026-06-25")
        self.assertEqual(parsed.start_time, "10:00")
        self.assertEqual(parsed.venue_name, "東京国際フォーラム")


if __name__ == "__main__":
    unittest.main()
