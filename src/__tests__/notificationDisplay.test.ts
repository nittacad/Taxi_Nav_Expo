import {
  formatNotificationTime,
  parseNotificationBody,
} from '@/utils/notificationDisplay';

describe('notificationDisplay', () => {
  it('parses venue boost into type, name, and checkout line', () => {
    const row = parseNotificationBody(
      '需要ブースト接近',
      '🔴 【需要ブースト】帝国ホテル\nチェックアウト予定: 12:00\n→ 大量のタクシー需要が予想されます！',
      'venue_boost'
    );

    expect(row.typeLabel).toBe('需要ブースト');
    expect(row.marker).toBe('🔴');
    expect(row.placeName).toBe('帝国ホテル');
    expect(row.infoLine).toBe('チェックアウト予定: 12:00');
    expect(row.demandLevelLabel).toBe('高需要');
  });

  it('parses orange venue boost as medium demand', () => {
    const row = parseNotificationBody(
      '需要ブースト接近',
      '🟠 【高需要】帝国ホテル\nチェックアウト予定: 12:00',
      'venue_boost'
    );

    expect(row.demandLevelLabel).toBe('中需要');
  });

  it('parses rokuyou boost notification', () => {
    const row = parseNotificationBody(
      '需要ブースト接近',
      '🔴 【需要ブースト・大安】帝国ホテル\nチェックアウト予定: 12:00\n六曜: 大安（結婚式需要強化日）',
      'rokuyou_boost'
    );

    expect(row.typeLabel).toBe('六曜・結婚式');
    expect(row.placeName).toBe('帝国ホテル');
    expect(row.infoLine).toBe('六曜: 大安（結婚式需要強化日）');
  });

  it('parses shareholder meeting notification', () => {
    const row = parseNotificationBody(
      '株主総会ブースト接近',
      '🔴 【大需要ブースト】デモホールディングス（東京国際フォーラム）\n株主総会終了予定: 13:00\n参加者数: 約5,000名',
      'shareholder_meeting_boost'
    );

    expect(row.typeLabel).toBe('株主総会');
    expect(row.placeName).toBe('デモホールディングス（東京国際フォーラム）');
    expect(row.infoLine).toBe('株主総会終了予定: 13:00');
  });

  it('parses station demand with predicted demand', () => {
    const row = parseNotificationBody(
      '高需要エリア接近',
      '東京駅付近でタクシー需要が高まっています（1.2km圏内）',
      'station_demand',
      { demandLevel: 'high', predictedDemand: 85 }
    );

    expect(row.typeLabel).toBe('駅・高需要');
    expect(row.placeName).toBe('東京駅');
    expect(row.infoLine).toBe('1.2km圏内');
    expect(row.predictedDemand).toBe(85);
    expect(row.demandLevelLabel).toBe('高需要');
  });

  it('formats today as HH:mm', () => {
    const now = new Date(2026, 5, 25, 15, 30);
    const received = new Date(2026, 5, 25, 9, 15).getTime();
    expect(formatNotificationTime(received, now)).toBe('09:15');
  });
});
