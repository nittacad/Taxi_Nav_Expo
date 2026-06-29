import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { DemandProvider } from '@/state/demandStore';
import { NotificationProvider } from '@/state/notificationStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initShareholderMeetingSchedule } from '@/services/shareholderMeetingRemoteStore';
import { initMedicalMeetingSchedule } from '@/services/medicalMeetingRemoteStore';
import { initCruiseTerminalSchedule } from '@/services/cruiseTerminalRemoteStore';
import { initFareWaveformAkihabaraSchedule } from '@/services/fareWaveformAkihabaraRemoteStore';
import { initFareWaveformTokyoSchedule } from '@/services/fareWaveformTokyoRemoteStore';
import { initFareWaveformUenoSchedule } from '@/services/fareWaveformUenoRemoteStore';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  useEffect(() => {
    void initShareholderMeetingSchedule();
    void initMedicalMeetingSchedule();
    void initCruiseTerminalSchedule();
    void initFareWaveformTokyoSchedule();
    void initFareWaveformUenoSchedule();
    void initFareWaveformAkihabaraSchedule();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <DemandProvider>
          <NotificationProvider>
            <AnimatedSplashOverlay />
            <Tabs
          screenOptions={{
            tabBarStyle: { backgroundColor: colors.background },
            tabBarActiveTintColor: colors.text,
            headerShown: false,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: '地図',
              tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: '予測',
              tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: '通知',
              tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: '設定',
              tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="venue-list"
            options={{
              href: null,
            }}
          />
        </Tabs>
          </NotificationProvider>
        </DemandProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
