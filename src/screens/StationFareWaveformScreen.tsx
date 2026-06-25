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
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FareWaveformChart } from '@/components/FareWaveformChart';
import { FareWaveformAirportBanner } from '@/components/FareWaveformAirportBanner';
import { FareWaveformLegend } from '@/components/FareWaveformLegend';
import { FareWaveformSummaryMetrics } from '@/components/FareWaveformSummaryMetrics';
import { FareWaveformToolbar } from '@/components/FareWaveformToolbar';
import { fareWaveformClient } from '@/services/FareWaveformClient';
import {
  DayCategory,
  DEFAULT_LAYER_VISIBILITY,
  DEFAULT_ZOOM_PX_PER_MINUTE,
  DAY_CATEGORY_LABELS,
  FareWaveformLayerVisibility,
  OverlayMode,
  StationFareWaveformData,
  TIME_PRESET_LABELS,
  TimePreset,
  ZoomLevel,
  EXIT_ID_TO_LAYER_KEY,
  zoomStep,
} from '@/types/fareWaveform';
import { ApiError } from '@/types';

const DAY_CATEGORIES: DayCategory[] = ['weekday', 'weekend_holiday'];

const TIME_PRESETS: TimePreset[] = ['peak', 'peak_narrow', 'evening'];

export const StationFareWaveformScreen: React.FC = () => {
  const router = useRouter();
  const { stationId: stationIdParam } = useLocalSearchParams<{ stationId: string }>();
  const stationId = Number(stationIdParam ?? '0');

  const [dayCategory, setDayCategory] = useState<DayCategory>('weekday');
  const [timePreset, setTimePreset] = useState<TimePreset>('peak');
  const [zoom, setZoom] = useState<ZoomLevel>(DEFAULT_ZOOM_PX_PER_MINUTE);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('capacity');
  const [data, setData] = useState<StationFareWaveformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<FareWaveformLayerVisibility>(
    DEFAULT_LAYER_VISIBILITY,
  );

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

  const toggleLayer = useCallback((exitId: keyof typeof EXIT_ID_TO_LAYER_KEY) => {
    const key = EXIT_ID_TO_LAYER_KEY[exitId];
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const headerTitle = useMemo(
    () => (data?.stationName ? `${data.stationName} 運賃波形` : '運賃波形'),
    [data?.stationName],
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
          <Text style={styles.calloutTitle}>ダイヤ合成</Text>
          <Text style={styles.calloutBody}>
            通常時刻表をベースに、臨時列車がある日は同じ1分スロットへ合成します（max
            運賃・収容人数合計）。土日祝は1区分。平日を選ぶと臨時は少なめ（GW想定1本）。
            本番では臨時ダイヤ JSON を日付指定で足し込みます。
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
            <FareWaveformAirportBanner highlights={data.airportHighlights} />

            <View style={styles.chartCard}>
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>曜日</Text>
                <View style={styles.chipRow}>
                  {DAY_CATEGORIES.map((category) => {
                    const selected = dayCategory === category;
                    return (
                      <Pressable
                        key={category}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setDayCategory(category)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {DAY_CATEGORY_LABELS[category]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>時間帯</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {TIME_PRESETS.map((preset) => {
                    const selected = timePreset === preset;
                    return (
                      <Pressable
                        key={preset}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setTimePreset(preset)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {TIME_PRESET_LABELS[preset]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <FareWaveformLegend
                exits={data.exits}
                layerVisibility={layerVisibility}
                onToggle={toggleLayer}
              />

              <FareWaveformToolbar
                zoom={zoom}
                onZoomIn={() => setZoom((z) => zoomStep(z, 1))}
                onZoomOut={() => setZoom((z) => zoomStep(z, -1))}
                onZoomReset={() => setZoom(DEFAULT_ZOOM_PX_PER_MINUTE)}
                overlayMode={overlayMode}
                onOverlayChange={setOverlayMode}
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
  pickerRow: {
    gap: 6,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ECF0F1',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  chipSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipText: {
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});

export default StationFareWaveformScreen;
