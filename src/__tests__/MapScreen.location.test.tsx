/**
 * MapScreen 位置・カメラ制御の回帰テスト
 * 「地図が戻る」再発防止: animateToRegion は初回センタリングのみ
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { MapScreen } from '../screens/MapScreen';
import { DemandContext } from '../state/demandStore';
import type { StationDemand } from '@/types';

const mockAnimateToRegion = jest.fn();
const locationUpdateCallbackRef: { current: ((loc: { latitude: number; longitude: number }) => void) | null } = {
  current: null,
};

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('../services/LocationService', () => ({
  locationService: {
    getCurrentLocationAsync: jest.fn().mockResolvedValue({ latitude: 35.68, longitude: 139.76 }),
    startLocationUpdatesAsync: jest.fn().mockImplementation(async (onUpdate: (loc: { latitude: number; longitude: number }) => void) => {
      locationUpdateCallbackRef.current = onUpdate;
      return true;
    }),
    stopLocationUpdates: jest.fn(),
  },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<{ animateToRegion: jest.Mock; coordinateForPoint: jest.Mock }>) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: mockAnimateToRegion,
      coordinateForPoint: jest.fn().mockResolvedValue({ latitude: 35.68, longitude: 139.76 }),
    }));
    return <View testID="map-view" {...props} />;
  });
  MockMapView.displayName = 'MockMapView';
  MockMapView.PROVIDER_GOOGLE = 'google';
  MockMapView.Marker = (props: Record<string, unknown>) => <View testID="map-marker" {...props} />;
  MockMapView.Callout = (props: Record<string, unknown>) => <View testID="map-callout" {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    PROVIDER_GOOGLE: 'google',
    Marker: MockMapView.Marker,
    Callout: MockMapView.Callout,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const chain = () => ({
    onStart: () => chain(),
    onUpdate: () => chain(),
    onEnd: () => chain(),
    activeOffsetX: () => chain(),
    activeOffsetY: () => chain(),
    minDuration: () => chain(),
    maxDuration: () => chain(),
  });
  return {
    NativeViewGestureHandler: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    GestureDetector: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Gesture: {
      Pan: () => chain(),
      Tap: () => chain(),
      LongPress: () => chain(),
      Simultaneous: (...gestures: unknown[]) => gestures[0],
      Exclusive: (...gestures: unknown[]) => gestures[0],
    },
  };
});

jest.mock('../components/PinDropFAB', () => ({
  PinDropFAB: () => null,
}));

function createDemandContext(stations: Map<number, StationDemand>) {
  return {
    state: { stations, loading: false, error: null, lastUpdated: Date.now(), isOnline: true },
    fetchStationDemand: jest.fn(),
    fetchMultipleStations: jest.fn(),
    fetchDemandByBounds: jest.fn().mockResolvedValue(Array.from(stations.values())),
    clearCache: jest.fn(),
    setOnlineStatus: jest.fn(),
  };
}

describe('MapScreen location bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    locationUpdateCallbackRef.current = null;
  });

  it('centers map only once on initial GPS fix', async () => {
    const mockContext = createDemandContext(new Map());

    render(
      <DemandContext.Provider value={mockContext}>
        <MapScreen />
      </DemandContext.Provider>
    );

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      locationUpdateCallbackRef.current?.({ latitude: 35.69, longitude: 139.77 });
    });

    expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
  });

  it('does not re-center when demand data updates after fetch', async () => {
    const initialStations = new Map<number, StationDemand>();
    const mockContext = createDemandContext(initialStations);

    const { rerender } = render(
      <DemandContext.Provider value={mockContext}>
        <MapScreen />
      </DemandContext.Provider>
    );

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
    });

    const updatedStations = new Map<number, StationDemand>([
      [
        1,
        {
          stationId: 1,
          stationName: '東京駅',
          predictedDemand: 85,
          riskLevel: 'high',
          confidence: 0.9,
          timestamp: Date.now(),
          trend: 'up',
        },
      ],
    ]);

    rerender(
      <DemandContext.Provider value={createDemandContext(updatedStations)}>
        <MapScreen />
      </DemandContext.Provider>
    );

    await act(async () => {
      locationUpdateCallbackRef.current?.({ latitude: 35.69, longitude: 139.77 });
    });

    expect(mockAnimateToRegion).toHaveBeenCalledTimes(1);
  });

  it('disables automatic user-location follow on MapView', async () => {
    const mockContext = createDemandContext(new Map());

    const { getByTestId } = render(
      <DemandContext.Provider value={mockContext}>
        <MapScreen />
      </DemandContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId('map-view').props.followsUserLocation).toBe(false);
      expect(getByTestId('map-view').props.scrollEnabled).toBe(true);
    });
  });
});
