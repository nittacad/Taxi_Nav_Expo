import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../screens/SettingsScreen';
import { demandApiClient } from '@/services/DemandAPIClient';
import { notificationEngine } from '@/services/NotificationEngine';
import { Alert } from 'react-native';

jest.mock('@/services/DemandAPIClient', () => ({
  demandApiClient: {
    registerVip: jest.fn(),
  },
}));

jest.mock('@/services/NotificationEngine', () => ({
  notificationEngine: {
    runVenueBoostTest: jest.fn().mockResolvedValue({
      boostTargets: ['帝国ホテル', 'ホテルオークラ東京'],
      sent: ['帝国ホテル'],
      skipped: [],
    }),
  },
}));

jest.spyOn(Alert, 'alert');

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsScreen />);
    
    expect(getByText('設定')).toBeTruthy();
    expect(getByText('Notification Radius (km)')).toBeTruthy();
    expect(getByText('VIP Registration')).toBeTruthy();
    expect(getByPlaceholderText('e.g. 3')).toBeTruthy();
  });

  it('registers VIP successfully', async () => {
    (demandApiClient.registerVip as jest.Mock).mockResolvedValue({
      status: 'success',
      vip_id: 'VIP-001',
      created_at: '2026-06-21T12:05:00Z',
    });

    const { getByText } = render(<SettingsScreen />);
    
    const button = getByText('Register VIP');
    fireEvent.press(button);

    await waitFor(() => {
      expect(demandApiClient.registerVip).toHaveBeenCalledWith(
        expect.objectContaining({
          driver_id: 'D-001',
          pickup_lat: 35.681236,
          pickup_lng: 139.767125,
          dropoff_lat: 35.658034,
          dropoff_lng: 139.701636,
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'VIP registered! ID: VIP-001');
    });
  });

  it('handles VIP registration error', async () => {
    (demandApiClient.registerVip as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<SettingsScreen />);
    
    const button = getByText('Register VIP');
    fireEvent.press(button);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to register VIP');
    });
  });

  it('runs venue boost test from dev panel', async () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('通知を送信（テスト）'));

    await waitFor(() => {
      expect(notificationEngine.runVenueBoostTest).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        '通知テスト完了',
        expect.stringContaining('送信: 1件')
      );
    });
  });
});
