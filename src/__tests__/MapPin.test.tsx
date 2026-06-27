import React from 'react';
import { render } from '@testing-library/react-native';
import { MapPin } from '../components/MapPin';

// react-native-maps のモック
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props: any) => <View {...props}>{props.children}</View>;
  const MockMarker = (props: any) => <View testID="marker" {...props}>{props.children}</View>;
  const MockCallout = (props: any) => <View testID="callout" {...props}>{props.children}</View>;
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: MockCallout,
  };
});

describe('MapPin Component', () => {
  it('renders correctly with given props', () => {
    const mockProps = {
      coordinate: { latitude: 35.681236, longitude: 139.767125 },
      title: '東京駅',
      demandScore: 45,
      color: '#F44336',
    };

    const { getByText, getByTestId } = render(<MapPin {...mockProps} />);

    // 需要スコアがピンに表示されているか
    expect(getByText('45')).toBeTruthy();

    // Callout内にタイトルと待ち客数が表示されているか
    expect(getByText('東京駅', { exact: false })).toBeTruthy();
    expect(getByText('待ち客数: 45人', { exact: false })).toBeTruthy();
  });
});
