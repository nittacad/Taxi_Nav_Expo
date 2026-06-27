import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { NotificationListScreen } from '../screens/NotificationListScreen';
import { NotificationProvider } from '@/state/notificationStore';
import { recordNotification, resetNotificationHistoryForTests } from '@/services/notificationHistory';
import { requestMapFocus } from '@/services/mapFocusStore';

const mockPush = jest.fn();

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/mapFocusStore', () => ({
  requestMapFocus: jest.fn(),
  subscribeMapFocus: jest.fn(() => jest.fn()),
  consumeMapFocus: jest.fn(() => null),
}));

describe('NotificationListScreen', () => {
  beforeEach(() => {
    resetNotificationHistoryForTests();
    mockPush.mockClear();
    jest.mocked(requestMapFocus).mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders empty state', () => {
    const { getByText } = render(
      <NotificationProvider>
        <NotificationListScreen />
      </NotificationProvider>
    );
    expect(getByText('通知')).toBeTruthy();
    expect(getByText('通知はまだありません')).toBeTruthy();
  });

  it('renders three-line notification layout with demand level', () => {
    recordNotification({
      title: '需要ブースト接近',
      body: '🔴 【需要ブースト】帝国ホテル\nチェックアウト予定: 12:00\n→ 大量のタクシー需要が予想されます！',
      category: 'venue_boost',
      demandLevel: 'high',
    });

    const { getByText, queryByText } = render(
      <NotificationProvider>
        <NotificationListScreen />
      </NotificationProvider>
    );

    expect(getByText('高需要')).toBeTruthy();
    expect(getByText('🔴 帝国ホテル')).toBeTruthy();
    expect(getByText('チェックアウト予定: 12:00')).toBeTruthy();
    expect(queryByText('需要ブースト')).toBeNull();
    expect(queryByText('需要ブースト接近')).toBeNull();
    expect(queryByText('→ 大量のタクシー需要が予想されます！')).toBeNull();
  });

  it('renders station notification with demand percentage', () => {
    recordNotification({
      title: '高需要エリア接近',
      body: '東京駅付近でタクシー需要が高まっています（1.2km圏内）',
      category: 'station_demand',
      demandLevel: 'high',
      predictedDemand: 88,
    });

    const { getByText } = render(
      <NotificationProvider>
        <NotificationListScreen />
      </NotificationProvider>
    );

    expect(getByText('需要: 88%')).toBeTruthy();
    expect(getByText('高需要')).toBeTruthy();
  });

  it('opens map on long press when location is known', () => {
    recordNotification({
      title: '需要ブースト接近',
      body: '🔴 【需要ブースト】帝国ホテル\nチェックアウト予定: 12:00',
      category: 'venue_boost',
      demandLevel: 'high',
      latitude: 35.675,
      longitude: 139.7709,
    });

    const { getByText } = render(
      <NotificationProvider>
        <NotificationListScreen />
      </NotificationProvider>
    );

    fireEvent(getByText('🔴 帝国ホテル'), 'longPress');

    expect(requestMapFocus).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 35.6723,
        longitude: 139.7584,
        label: '帝国ホテル',
      })
    );
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
