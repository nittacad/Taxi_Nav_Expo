/**
 * StationFareWaveformScreen.tsx
 * 東京駅 出口別 最高運賃波形（Canvas v2 UI 反映）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FareWaveformAirportBanner } from '@/components/FareWaveformAirportBanner';
import { FareWaveformChart } from '@/components/FareWaveformChart';
import { FareWaveformChartControls } from '@/components/FareWaveformChartControls';
import { FareWaveformExitPeaks } from '@/components/FareWaveformExitPeaks';
import { FareWaveformFilterRow } from '@/components/FareWaveformFilterRow';
import { FareWaveformLegend } from '@/components/FareWaveformLegend';
import { FareWaveformSummaryMetrics } from '@/components/FareWaveformSummaryMetrics';
import {
  computeExitPeaks,
  resolveTimeRange,
} from '@/data/fareWaveformEngine';
import { fareWaveformClient } from '@/services/FareWaveformClient';
import {
  DayCategory,
  createDefaultLayerVisibility,
  DEFAULT_TIME_PRESET,
  DEFAULT_ZOOM_PX_PER_MINUTE,
  FULL_DAY_DEFAULT_ZOOM_PX_PER_MINUTE,
  FareWaveformLayerVisibility,
  isTwoHourTimePreset,
  OverlayMode,
  StationFareWaveformData,
  TimePreset,
  ZoomLevel,
  zoomStep,
} from '@/types/fareWaveform';
import { ApiError } from '@/types';

export const StationFareWaveformScreen: React.FC = () => {
  const router = useRouter();
  const { stationId: stationIdParam } = useLocalSearchParams<{ stationId: string }>();
  const stationId = Number(stationIdParam ?? '0');

  const [dayCategory, setDayCategory] = useState<DayCategory>('weekday');
  const [timePreset, setTimePreset] = useState<TimePreset>(DEFAULT_TIME_PRESET);
  const [zoom, setZoom] = useState<ZoomLevel>(DEFAULT_ZOOM_PX_PER_MINUTE);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('capacity');
  const [data, setData] = useState<StationFareWaveformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<FareWaveformLayerVisibility>({});

  const defaultZoom =
    timePreset === 'full_day'
      ? FULL_DAY_DEFAULT_ZOOM_PX_PER_MINUTE
      : DEFAULT_ZOOM_PX_PER_MINUTE;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fareWaveformClient.fetchStationFareWaveform(
        stationId,
        dayCategory,
        timePreset,
      );
      setData(result);
      setLayerVisibility(createDefaultLayerVisibility(result.exits));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : '運賃波形データの取得に失敗しました';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [stationId, dayCategory, timePreset]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom]);

  const toggleLayer = useCallback((exitId: string) => {
    setLayerVisibility((prev) => ({ ...prev, [exitId]: !(prev[exitId] ?? true) }));
  }, []);

  const headerTitle = useMemo(
    () => (data?.stationName ? `${data.stationName} 運賃波形` : '運賃波形'),
    [data?.stationName],
  );

  const exitPeaks = useMemo(() => {
    if (!data || !isTwoHourTimePreset(timePreset)) {
      return [];
    }
    return computeExitPeaks(data.exits, data.timeLabels, layerVisibility);
  }, [data, timePreset, layerVisibility]);

  const timeRangeLabel = useMemo(
    () => resolveTimeRange(timePreset).label,
    [timePreset],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Ionicons name="chevron-back" size={24} color="#3498DB" />
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          {data
            ? `${data.startTime}–${data.endTime} · 1分ごと max(運賃) · 到着イベント ${data.stats.arrivalEventCount} 本`
            : '17:00–19:00 · 1分ごと max(運賃) · 鉄道運賃プロキシ'}
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>ダイヤ合成（モック）</Text>
          <Text style={styles.calloutBody}>
            本番時刻表の代わりにルール合成データを表示しています。時間帯は2時間刻みまたは始発〜終電（5:00–23:30）を選べます。
          </Text>
        </View>

        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>波形データを読み込み中...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && data && (
          <>
            <FareWaveformSummaryMetrics stats={data.stats} />

            <View style={styles.chartCard}>
              <FareWaveformFilterRow
                dayCategory={dayCategory}
                onDayCategoryChange={setDayCategory}
                timePreset={timePreset}
                onTimePresetChange={setTimePreset}
              />

              <FareWaveformChartControls
                zoom={zoom}
                defaultZoom={defaultZoom}
                onZoomIn={() => setZoom((z) => zoomStep(z, 1))}
                onZoomOut={() => setZoom((z) => zoomStep(z, -1))}
                onZoomReset={() => setZoom(defaultZoom)}
                overlayMode={overlayMode}
                onOverlayChange={setOverlayMode}
              />

              <FareWaveformLegend
                exits={data.exits}
                layerVisibility={layerVisibility}
                onToggle={toggleLayer}
              />

              <FareWaveformChart
                timeLabels={data.timeLabels}
                exits={data.exits}
                totalCapacityByMinute={data.totalCapacityByMinute}
                trainCountByMinute={data.trainCountByMinute}
                overlayMode={overlayMode}
                layerVisibility={layerVisibility}
                airportHighlights={data.airportHighlights}
                pxPerMinute={zoom}
              />

              {isTwoHourTimePreset(timePreset) && (
                <FareWaveformExitPeaks
                  timeRangeLabel={timeRangeLabel}
                  peaks={exitPeaks}
                />
              )}

              <FareWaveformAirportBanner highlights={data.airportHighlights} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#3498DB',
    marginLeft: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  callout: {
    backgroundColor: '#D6EAF8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4965',
    marginBottom: 4,
  },
  calloutBody: {
    fontSize: 12,
    color: '#1B4965',
    lineHeight: 18,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    color: '#7F8C8D',
  },
  errorBox: {
    backgroundColor: '#FADBD8',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
  },
});

export default StationFareWaveformScreen;
