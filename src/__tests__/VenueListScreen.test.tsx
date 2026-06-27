import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { VenueListScreen } from '@/screens/VenueListScreen';
import { requestMapFocus } from '@/services/mapFocusStore';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/mapFocusStore', () => ({
  requestMapFocus: jest.fn(),
}));

jest.mock('@/services/LocationService', () => ({
  locationService: {
    getCurrentLocationAsync: jest.fn().mockResolvedValue({
      latitude: 35.705616,
      longitude: 139.794489,
    }),
  },
}));

jest.mock('@/services/businessChainDiscoveryService', () => ({
  discoverBusinessChainsNear: jest.fn().mockResolvedValue({ queried: false, addedCount: 0, cellKey: '0_0' }),
}));

describe('VenueListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists master venues and nearby business chain section', async () => {
    const { getByText } = render(<VenueListScreen />);

    await waitFor(() => {
      expect(getByText(/登録ホテル・会場（32 件）/)).toBeTruthy();
      expect(getByText(/近くのビジネスチェーン/)).toBeTruthy();
    });

    expect(getByText(/🔴 帝国ホテル/)).toBeTruthy();
    expect(getByText(/🔴 八芳園/)).toBeTruthy();
  });

  it('opens map focus when a venue row is pressed', async () => {
    const { getByText } = render(<VenueListScreen />);

    await waitFor(() => {
      expect(getByText(/🔴 帝国ホテル/)).toBeTruthy();
    });

    fireEvent.press(getByText(/🔴 帝国ホテル/));

    expect(requestMapFocus).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '帝国ホテル',
        latitude: 35.6723,
        longitude: 139.7584,
      })
    );
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
