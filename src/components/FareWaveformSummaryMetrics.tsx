/**
 * FareWaveformSummaryMetrics.tsx
 * 最高運賃 / ピーク時刻 / 到着イベント数（+臨時）
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { StationFareWaveformStats } from '@/types/fareWaveform';

interface FareWaveformSummaryMetricsProps {
  stats: StationFareWaveformStats;
}

function EventCountValue({
  total,
  extra,
}: {
  total: number;
  extra: number;
}) {
  return (
    <View style={styles.eventCountRow}>
      <Text style={styles.metricValue}>{total}</Text>
      {extra > 0 && (
        <>
          <Text style={styles.metricValueExtra}>+{extra}</Text>
          <Text style={styles.metricValueSuffix}>（臨時列車）</Text>
        </>
      )}
    </View>
  );
}

export const FareWaveformSummaryMetrics: React.FC<
  FareWaveformSummaryMetricsProps
> = ({ stats }) => (
  <View style={styles.row}>
    <View style={styles.cell}>
      <View style={styles.valueArea}>
        <Text style={styles.metricValue} numberOfLines={1}>
          {`¥${stats.peakFare.toLocaleString('ja-JP')}`}
        </Text>
      </View>
      <Text style={styles.metricLabel} numberOfLines={2}>
        {`最高運賃（${stats.peakFareExitName}）`}
      </Text>
    </View>
    <View style={styles.cell}>
      <View style={styles.valueArea}>
        <Text style={[styles.metricValue, styles.peakTimeValue]}>
          {stats.peakTime}
        </Text>
      </View>
      <Text style={styles.metricLabel}>ピーク時刻</Text>
    </View>
    <View style={styles.cell}>
      <View style={styles.valueArea}>
        <EventCountValue
          total={stats.arrivalEventCount}
          extra={stats.extraTrainCount}
        />
      </View>
      <Text style={styles.metricLabel}>到着イベント数</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    height: 56,
  },
  valueArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
  },
  peakTimeValue: {
    color: '#F39C12',
  },
  metricLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 14,
  },
  eventCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
  },
  metricValueExtra: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F39C12',
    marginLeft: 2,
  },
  metricValueSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8C8D',
    marginLeft: 2,
  },
});

export default FareWaveformSummaryMetrics;
