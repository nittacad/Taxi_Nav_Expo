import { parseShareholderMeetingsCsv } from '@/utils/shareholderMeetingCsvParser';

const SAMPLE_CSV = `# comment
id,company_name,venue_name,meeting_date,start_time,participant_count
agm_2026_tif_demo,デモホールディングス,東京国際フォーラム,2026-06-25,10:00,5000
,サンプル商事,東京ドーム,2026-06-25,9:00,8000
bad_venue,テスト,存在しない会場,2026-06-25,10:00,100
`;

describe('shareholderMeetingCsvParser', () => {
  it('parses valid rows and normalizes time', () => {
    const { meetings, issues } = parseShareholderMeetingsCsv(SAMPLE_CSV);

    expect(meetings.length).toBe(2);
    expect(meetings[0].startTime).toBe('09:00');
    expect(meetings[1].companyName).toBe('デモホールディングス');
    expect(issues.some((i) => i.message.includes('座標未解決'))).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const csv = `id,company_name,venue_name,meeting_date,start_time,participant_count
a,会社A,東京ドーム,2026-06-25,10:00,100
a,会社B,東京ドーム,2026-06-26,10:00,200
`;
    const { meetings, issues } = parseShareholderMeetingsCsv(csv);
    expect(meetings.length).toBe(1);
    expect(issues.some((i) => i.message.includes('重複 id'))).toBe(true);
  });

  it('auto-generates id when empty', () => {
    const { meetings } = parseShareholderMeetingsCsv(SAMPLE_CSV);
    const auto = meetings.find((m) => m.companyName === 'サンプル商事');
    expect(auto?.id).toMatch(/^agm_/);
  });

  it('rejects unknown venue without coordinates in legacy CSV', () => {
    const { meetings, issues } = parseShareholderMeetingsCsv(SAMPLE_CSV);
    expect(meetings.length).toBe(2);
    expect(issues.some((i) => i.message.includes('座標未解決'))).toBe(true);
  });

  it('accepts extended CSV with latitude/longitude for new venues', () => {
    const csv = `id,company_name,venue_name,venue_address,ward,latitude,longitude,meeting_date,start_time,participant_count
agm_imperial,テスト,帝国ホテル,東京都千代田区内幸町1-1,千代田区,35.6723,139.7587,2026-06-28,11:00,3000
`;
    const { meetings, issues } = parseShareholderMeetingsCsv(csv);
    expect(issues.length).toBe(0);
    expect(meetings[0].latitude).toBe(35.6723);
    expect(meetings[0].ward).toBe('千代田区');
  });
});
