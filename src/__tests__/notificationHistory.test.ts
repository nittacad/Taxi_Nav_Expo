import {
  clearNotificationHistory,
  getUnreadNotificationCount,
  inferNotificationCategory,
  markAllNotificationsRead,
  recordNotification,
  resetNotificationHistoryForTests,
  subscribeNotificationHistory,
} from '@/services/notificationHistory';

describe('notificationHistory', () => {
  beforeEach(() => {
    resetNotificationHistoryForTests();
  });

  it('records and lists notifications newest first', () => {
    recordNotification({ title: '需要ブースト接近', body: '帝国ホテル', category: 'venue_boost' });
    recordNotification({ title: '高需要エリア接近', body: '東京駅', category: 'station_demand' });

    let snapshot: readonly { title: string }[] = [];
    const unsubscribe = subscribeNotificationHistory((items) => {
      snapshot = items;
    });

    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]?.title).toBe('高需要エリア接近');
    unsubscribe();
  });

  it('infers category from title', () => {
    expect(inferNotificationCategory('需要ブースト接近')).toBe('venue_boost');
    expect(inferNotificationCategory('高需要エリア接近')).toBe('station_demand');
  });

  it('tracks unread count', () => {
    recordNotification({ title: '需要ブースト接近', body: 'test' });
    expect(getUnreadNotificationCount()).toBe(1);
    markAllNotificationsRead();
    expect(getUnreadNotificationCount()).toBe(0);
  });

  it('clears history', () => {
    recordNotification({ title: 'a', body: 'b' });
    clearNotificationHistory();
    expect(getUnreadNotificationCount()).toBe(0);
  });
});
