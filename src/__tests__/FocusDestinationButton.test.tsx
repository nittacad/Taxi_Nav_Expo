import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FocusDestinationButton } from '@/components/FocusDestinationButton';
import { openMapsNavigation } from '@/utils/openMapsNavigation';

jest.mock('@/utils/openMapsNavigation', () => ({
  openMapsNavigation: jest.fn(),
}));

describe('FocusDestinationButton', () => {
  it('opens maps navigation with label when pressed', () => {
    const { getByText } = render(
      <FocusDestinationButton
        label="帝国ホテル"
        latitude={35.6723}
        longitude={139.7584}
      />
    );

    fireEvent.press(getByText('📍 帝国ホテルへナビ'));

    expect(openMapsNavigation).toHaveBeenCalledWith(
      { latitude: 35.6723, longitude: 139.7584 },
      '帝国ホテル'
    );
  });

  it('calls onDismiss when close is pressed', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <FocusDestinationButton
        label="帝国ホテル"
        latitude={35.6723}
        longitude={139.7584}
        onDismiss={onDismiss}
      />
    );

    fireEvent.press(getByText('✕'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
