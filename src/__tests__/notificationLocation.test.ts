import { resolveNotificationLocation } from '@/utils/notificationLocation';

describe('notificationLocation', () => {
  it('resolves venue boost from canonical registry over stale stored coordinates', () => {
    const location = resolveNotificationLocation({
      id: '1',
      title: '需要ブースト接近',
      body: '🔴 【需要ブースト】帝国ホテル\nチェックアウト予定: 12:00',
      category: 'venue_boost',
      receivedAt: 0,
      read: false,
      latitude: 35.672,
      longitude: 139.7588,
    });

    expect(location?.latitude).toBe(35.6723);
    expect(location?.longitude).toBe(139.7584);
    expect(location?.label).toBe('帝国ホテル');
  });

  it('resolves venue boost by place name when coordinates are missing', () => {
    const location = resolveNotificationLocation({
      id: '1',
      title: '需要ブースト接近',
      body: '🔴 【需要ブースト】帝国ホテル\nチェックアウト予定: 12:00',
      category: 'venue_boost',
      receivedAt: 0,
      read: false,
    });

    expect(location?.label).toBe('帝国ホテル');
    expect(location?.latitude).toBeCloseTo(35.6723, 2);
  });

  it('resolves station demand by station name', () => {
    const location = resolveNotificationLocation({
      id: '1',
      title: '高需要エリア接近',
      body: '東京駅付近でタクシー需要が高まっています（1.2km圏内）',
      category: 'station_demand',
      receivedAt: 0,
      read: false,
    });

    expect(location?.label).toBe('東京駅');
    expect(location?.latitude).toBeCloseTo(35.681236, 4);
  });

  it('resolves Four Seasons Marunouchi on Pacific Century Place', () => {
    const location = resolveNotificationLocation({
      id: '1',
      title: '需要ブースト接近',
      body: '🔴 【需要ブースト】フォーシーズンズホテル東京丸の内\nチェックアウト予定: 12:00',
      category: 'venue_boost',
      receivedAt: 0,
      read: false,
    });

    expect(location?.label).toBe('フォーシーズンズホテル東京丸の内');
    expect(location?.latitude).toBeCloseTo(35.6781, 3);
    expect(location?.longitude).toBeCloseTo(139.767, 3);
  });
});
