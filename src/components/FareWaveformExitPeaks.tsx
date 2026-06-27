/**
 * FareWaveformExitPeaks.tsx
 * 2時間スロット選択時の出口別ピーク時刻
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { ExitPeakSummary } from '@/types/fareWaveform';

interface FareWaveformExitPeaksProps {
  timeRangeLabel: string;
  peaks: ExitPeakSummary[];
}

export const FareWaveformExitPeaks: React.FC<FareWaveformExitPeaksProps> = ({
  timeRangeLabel,
  peaks,
}) => {
  if (peaks.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>出口別ピーク（{timeRangeLabel}）</Text>
      <View style={styles.grid}>
        {peaks.map((peak) => (
          <View key={peak.exitId} style={styles.item}>
            <View style={styles.itemHead}>
              <View style={[styles.dot, { backgroundColor: peak.color }]} />
              <Text style={styles.exitName} numberOfLines={1}>
                {peak.exitName}
              </Text>
            </View>
            <Text style={styles.peakTime}>{peak.peakTime}</Text>
            <Text style={styles.peakFare}>
              ¥{peak.peakFare.toLocaleString('ja-JP')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    minWidth: '46%',
    flexGrow: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  exitName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  peakTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F39C12',
  },
  peakFare: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 2,
  },
});

export default FareWaveformExitPeaks;
