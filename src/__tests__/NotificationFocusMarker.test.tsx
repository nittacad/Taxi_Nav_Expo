import React from 'react';
import { render } from '@testing-library/react-native';
import { NotificationFocusMarker } from '@/components/NotificationFocusMarker';

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Marker: ({ children, ...props }: Record<string, unknown>) => (
      <View testID="notification-focus-marker" {...props}>
        {children}
      </View>
    ),
  };
});

describe('NotificationFocusMarker', () => {
  it('renders pulsing marker with label', () => {
    const { getByText, getByTestId } = render(
      <NotificationFocusMarker latitude={35.672} longitude={139.7588} label="帝国ホテル" />
    );

    expect(getByTestId('notification-focus-marker')).toBeTruthy();
    expect(getByText('帝国ホテル')).toBeTruthy();
  });

  it('calls onFinished after pulse duration', () => {
    jest.useFakeTimers();
    const onFinished = jest.fn();

    render(
      <NotificationFocusMarker
        latitude={35.672}
        longitude={139.7588}
        label="帝国ホテル"
        onFinished={onFinished}
      />
    );

    jest.advanceTimersByTime(5000);
    expect(onFinished).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
