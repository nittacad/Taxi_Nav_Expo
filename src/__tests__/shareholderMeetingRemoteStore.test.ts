jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        shareholderMeetingsJsonUrl: 'https://example.com/shareholder-meetings.json',
      },
    },
  },
}));

import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';
import {
  parseShareholderMeetingsRemotePayload,
  refreshShareholderMeetingSchedule,
  resetShareholderMeetingScheduleForTests,
} from '@/services/shareholderMeetingRemoteStore';

const SAMPLE_MEETING: ScheduledShareholderMeeting = {
  id: 'agm_test',
  companyName: 'テスト',
  venueName: '東京国際フォーラム',
  meetingDate: '2026-06-25',
  startTime: '10:00',
  participantCount: 1000,
};

describe('shareholderMeetingRemoteStore', () => {
  beforeEach(() => {
    resetShareholderMeetingScheduleForTests();
    global.fetch = jest.fn();
  });

  it('parses valid remote payload', () => {
    const parsed = parseShareholderMeetingsRemotePayload({
      version: 1,
      generatedAt: '2026-06-27T00:00:00Z',
      meetings: [SAMPLE_MEETING],
    });
    expect(parsed?.length).toBe(1);
    expect(parsed?.[0].companyName).toBe('テスト');
  });

  it('rejects invalid version', () => {
    expect(
      parseShareholderMeetingsRemotePayload({ version: 99, meetings: [SAMPLE_MEETING] })
    ).toBeNull();
  });

  it('updates schedule from remote fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 1,
        generatedAt: '2026-06-27T00:00:00Z',
        meetings: [SAMPLE_MEETING],
      }),
    });

    const status = await refreshShareholderMeetingSchedule({ force: true });
    expect(status.source).toBe('remote');
    expect(status.meetingCount).toBe(1);
  });
});
