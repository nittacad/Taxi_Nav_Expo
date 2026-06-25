/**
 * jest.setup.js
 * Jest グローバルセットアップ
 */

// React Native Expo の環境変数設定
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000/api/v1';

// Mock global fetch
global.fetch = jest.fn();

// 警告ログの抑止
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}), { virtual: true });

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(View, props),
    AntDesign: (props: any) => React.createElement(View, props),
    MaterialIcons: (props: any) => React.createElement(View, props),
  };
});
