import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { DemandProvider } from '@/state/demandStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DemandProvider>
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
              title: 'Map',
              tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Stations',
              tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
            }}
          />
        </Tabs>
      </DemandProvider>
    </GestureHandlerRootView>
  );
}
