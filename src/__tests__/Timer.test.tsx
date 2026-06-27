import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Timer } from '../components/Timer';

describe('Timer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial time correctly', () => {
    const { getByText } = render(<Timer initialSeconds={120} />);
    
    // 120秒 = 02:00
    expect(getByText('02:00')).toBeTruthy();
  });

  it('decrements time every second', () => {
    const { getByText } = render(<Timer initialSeconds={65} />);
    
    expect(getByText('01:05')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText('01:04')).toBeTruthy();
  });

  it('calls onExpire when time reaches 0', () => {
    const onExpireMock = jest.fn();
    render(<Timer initialSeconds={2} onExpire={onExpireMock} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onExpireMock).toHaveBeenCalledTimes(1);
  });
});
