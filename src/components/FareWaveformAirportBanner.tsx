/**
 * FareWaveformAirportBanner.tsx
 * 到着出口色 + 成田/羽田ラベルで到着本数を強調表示
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import {
  AIRPORT_ORIGIN_ORDER,
  AIRPORT_ORIGIN_SHORT_LABELS,
  AirportArrivalHighlight,
  AirportOrigin,
} from '@/types/fareWaveform';

interface FareWaveformAirportBannerProps {
  highlights: AirportArrivalHighlight[];
}

export const FareWaveformAirportBanner: React.FC<FareWaveformAirportBannerProps> = ({
  highlights,
}) => {
  const entries = useMemo(() => {
    const counts: Partial<Record<AirportOrigin, number>> = {};
    const markerColors: Partial<Record<AirportOrigin, string[]>> = {};

    for (const highlight of highlights) {
      counts[highlight.origin] = (counts[highlight.origin] ?? 0) + 1;
      const colors = markerColors[highlight.origin] ?? [];
      if (!colors.includes(highlight.markerColor)) {
        colors.push(highlight.markerColor);
      }
      markerColors[highlight.origin] = colors;
    }

    return AIRPORT_ORIGIN_ORDER.filter((origin) => (counts[origin] ?? 0) > 0).map(
      (origin) => ({
        origin,
        count: counts[origin] ?? 0,
        markerColors: markerColors[origin] ?? [],
      }),
    );
  }, [highlights]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>空港便（表示域）</Text>
      <View style={styles.countRow}>
        {entries.map(({ origin, count, markerColors }) => (
          <View key={origin} style={styles.countItem}>
            <View style={styles.dotRow}>
              {markerColors.map((color) => (
                <View
                  key={color}
                  style={[styles.dot, { backgroundColor: color }]}
                />
              ))}
            </View>
            <Text style={styles.countText}>
              {AIRPORT_ORIGIN_SHORT_LABELS[origin]} {count}本
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        グラフ上の縦線は到着出口の色で強調しています
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF9E7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5CBA7',
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D6608',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
  },
  hint: {
    fontSize: 11,
    color: '#7F8C8D',
  },
});

export default FareWaveformAirportBanner;
