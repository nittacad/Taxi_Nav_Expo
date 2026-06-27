import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('Taxi Nav')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('ログイン')).toBeTruthy();
  });

  it('calls onLogin when login button is pressed', () => {
    const mockOnLogin = jest.fn();
    const { getByText } = render(<LoginScreen onLogin={mockOnLogin} />);
    
    const loginButton = getByText('ログイン');
    fireEvent.press(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });
});
