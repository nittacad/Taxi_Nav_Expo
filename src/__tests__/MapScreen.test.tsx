import React from 'react';
import { render } from '@testing-library/react-native';
import { MapScreen } from '../screens/MapScreen';
import { DemandContext } from '../state/demandStore';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: any) => {
    return <View testID="map-view" {...props} />;
  };
  MockMapView.PROVIDER_GOOGLE = 'google';
  MockMapView.Marker = (props: any) => <View testID="map-marker" {...props} />;
  MockMapView.Callout = (props: any) => <View testID="map-callout" {...props} />;
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

describe('MapScreen', () => {
  it('renders correctly within Provider', () => {
    const mockContext = {
      state: { stations: new Map(), loading: false, error: null, lastUpdated: null, isOnline: true },
      fetchStationDemand: jest.fn(),
      fetchMultipleStations: jest.fn(),
      fetchDemandByBounds: jest.fn(),
      clearCache: jest.fn(),
      setOnlineStatus: jest.fn(),
    };

    const { getByTestId } = render(
      <DemandContext.Provider value={mockContext}>
        <MapScreen />
      </DemandContext.Provider>
    );
    expect(getByTestId('map-view')).toBeTruthy();
  });
});
