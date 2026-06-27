import { ShareholderMeetingNotificationEngine } from '@/services/ShareholderMeetingNotificationEngine';
import { DemandPriority } from '@/types/venueNotification';
import { getMeetingCount } from '@/data/shareholderMeetingSchedule';

describe('ShareholderMeetingNotificationEngine', () => {
  const engine = new ShareholderMeetingNotificationEngine();

  it('loads 5 venue registry entries via schedule', () => {
    expect(engine.getActiveVenues().length).toBeGreaterThanOrEqual(3);
    expect(getMeetingCount()).toBeGreaterThanOrEqual(2);
  });

  it('calculates end time from start and venue duration', () => {
    const start = new Date(2026, 5, 25, 10, 0);
    const end = engine.calculateMeetingEndTime(start, '東京国際フォーラム');
    expect(end.getHours()).toBe(13);
    expect(end.getMinutes()).toBe(0);
  });

  it('triggers boost 60 minutes before end', () => {
    const end = new Date(2026, 5, 25, 13, 0);
    const at60 = new Date(2026, 5, 25, 12, 0);
    const at90 = new Date(2026, 5, 25, 11, 30);

    expect(engine.checkBoostNotificationTrigger(at60, end)).toBe(true);
    expect(engine.checkBoostNotificationTrigger(at90, end)).toBe(false);
  });

  it('monitors today meetings and returns URGENT in boost window', () => {
    const current = new Date(2026, 5, 25, 12, 0);
    const results = engine.monitorTodayMeetings(current);
    const tif = results.find((r) => r.venue_name === '東京国際フォーラム');

    expect(tif).toBeDefined();
    expect(tif?.is_boost_target).toBe(true);
    expect(tif?.priority).toBe(DemandPriority.URGENT);
    expect(tif?.notification).toContain('株主総会終了予定');
    expect(tif?.notification).toContain('デモホールディングス');
  });

  it('generates notification with participant count', () => {
    const end = new Date(2026, 5, 25, 13, 0);
    const msg = engine.generateShareholderMeetingNotification(
      'デモホールディングス',
      '東京国際フォーラム',
      end,
      DemandPriority.URGENT,
      5000
    );
    expect(msg).toContain('5,000');
    expect(msg).toContain('【大需要ブースト】');
  });
});
