import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ACCENT_COLOR = '#2196F3';
const PULSE_MS = 550;
const PULSE_COUNT = 8;

export interface NotificationFocusMarkerProps {
  latitude: number;
  longitude: number;
  label: string;
  onFinished?: () => void;
}

export function NotificationFocusMarker({
  latitude,
  longitude,
  label,
  onFinished,
}: NotificationFocusMarkerProps): React.ReactElement {
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0.85);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(2.2, { duration: PULSE_MS, easing: Easing.out(Easing.quad) })
      ),
      PULSE_COUNT,
      false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 0 }),
        withTiming(0, { duration: PULSE_MS, easing: Easing.out(Easing.quad) })
      ),
      PULSE_COUNT,
      false
    );
    coreScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: PULSE_MS * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: PULSE_MS * 0.55, easing: Easing.in(Easing.quad) })
      ),
      PULSE_COUNT,
      false
    );

    const finishTimer = setTimeout(() => {
      onFinished?.();
    }, PULSE_MS * PULSE_COUNT + 200);

    return () => clearTimeout(finishTimer);
  }, [coreScale, label, latitude, longitude, onFinished, ringOpacity, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={999}
      tracksViewChanges={true}>
      <View style={styles.wrapper} pointerEvents="none">
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.core, coreStyle]} />
        <View style={styles.labelBubble}>
          <Text style={styles.labelText} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

export const NOTIFICATION_FOCUS_PULSE_DURATION_MS = PULSE_MS * PULSE_COUNT + 200;

const styles = StyleSheet.create({
  wrapper: {
    width: 120,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(33, 150, 243, 0.12)',
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ACCENT_COLOR,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  labelBubble: {
    position: 'absolute',
    top: 0,
    maxWidth: 116,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
