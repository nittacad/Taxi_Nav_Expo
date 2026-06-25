/**
 * StationDemandScreen.tsx
 * 駅需要予測を表示するスクリーン
 * 機能: 駅一覧、需要ヒートマップ、リアルタイム更新
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDemand } from '@/state/demandStore';
import { FARE_WAVEFORM_SUPPORTED_STATION_IDS, StationDemand } from '@/types';

/**
 * 需要レベルの色定義
 */
const getDemandColor = (demand: number): string => {
  if (demand >= 80) return '#E74C3C'; // 赤（高）
  if (demand >= 60) return '#F39C12'; // オレンジ（中）
  if (demand >= 40) return '#F1C40F'; // 黄色（中-低）
  return '#27AE60'; // 緑（低）
};

/**
 * リスクレベルのテキスト表示
 */
const getRiskLevelLabel = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'high':
      return '高リスク';
    case 'medium':
      return '中リスク';
    case 'low':
      return '低リスク';
    default:
      return 'N/A';
  }
};

/**
 * トレンド表示アイコン
 */
const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'stable':
      return '➡️';
    default:
      return '❓';
  }
};

/**
 * 駅需要カード コンポーネント
 */
interface StationCardProps {
  station: StationDemand;
  onPress?: () => void;
  showFareWaveformHint?: boolean;
}

const StationCard: React.FC<StationCardProps> = React.memo(
  ({ station, onPress, showFareWaveformHint = false }) => {
  const demandColor = getDemandColor(station.predictedDemand);
  const confidencePercent = Math.round(station.confidence * 100);

  const cardContent = (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.stationName}>{station.stationName}</Text>
        <View style={styles.cardHeaderRight}>
          {showFareWaveformHint && (
            <Ionicons
              name="analytics-outline"
              size={18}
              color="#3498DB"
              style={styles.fareHintIcon}
            />
          )}
          <Text style={styles.trendIcon}>{getTrendIcon(station.trend)}</Text>
        </View>
      </View>

      <View style={styles.demandContainer}>
        <View
          style={[
            styles.demandBar,
            {
              width: `${station.predictedDemand}%`,
              backgroundColor: demandColor,
            },
          ]}
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.demandText}>
          需要: {station.predictedDemand}%
        </Text>
        <Text style={[styles.riskBadge, { color: demandColor }]}>
          {getRiskLevelLabel(station.riskLevel)}
        </Text>
      </View>

      <View style={styles.cardStats}>
        <Text style={styles.statsText}>
          信頼度: {confidencePercent}% | 更新: {new Date(station.timestamp).toLocaleTimeString()}
        </Text>
        {showFareWaveformHint && (
          <Text style={styles.fareHintText}>タップで運賃波形を表示</Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: demandColor }]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { borderLeftColor: demandColor }]}>
      {cardContent}
    </View>
  );
});

/**
 * ステータスメッセージ コンポーネント
 */
interface StatusMessageProps {
  message: string;
  type: 'error' | 'info';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => (
  <View
    style={[
      styles.statusMessage,
      type === 'error' ? styles.errorMessage : styles.infoMessage,
    ]}
  >
    <Text
      style={[
        styles.statusText,
        type === 'error' ? styles.errorText : styles.infoText,
      ]}
    >
      {message}
    </Text>
  </View>
);

/**
 * StationDemandScreen コンポーネント
 */
export const StationDemandScreen: React.FC = () => {
  const router = useRouter();
  const { state, fetchMultipleStations, setOnlineStatus } = useDemand();
  const [refreshing, setRefreshing] = useState(false);

  // サンプル駅ID（実装時に API から取得）
  // 1-10: 駅, 101-106: ホテル (MOCK_DATAに合わせたID)
  const SAMPLE_STATION_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 101, 102, 103, 104, 105, 106];

  /**
   * ネットワークステータスのモック設定
   */
  useEffect(() => {
    // APIはモックを利用するため、強制的にオンライン状態とする
    setOnlineStatus(true);
  }, [setOnlineStatus]);

  /**
   * 初期ロード
   */
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        await fetchMultipleStations(SAMPLE_STATION_IDS);
      } catch (e) {
        console.warn("StationDemandScreen initial load error:", e);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [fetchMultipleStations]);

  /**
   * リフレッシュハンドラー
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMultipleStations(SAMPLE_STATION_IDS);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMultipleStations]);

  /**
   * 駅リストのレンダリング
   */
  const renderStationCard: ListRenderItem<StationDemand> = useCallback(
    ({ item }) => {
      const hasFareWaveform = FARE_WAVEFORM_SUPPORTED_STATION_IDS.has(item.stationId);
      return (
        <StationCard
          station={item}
          showFareWaveformHint={hasFareWaveform}
          onPress={
            hasFareWaveform
              ? () =>
                  router.push(
                    `/explore/station/${item.stationId}` as Href,
                  )
              : undefined
          }
        />
      );
    },
    [router],
  );

  // 駅データを配列に変換（FlatList 用）
  const stationList = useMemo(() => Array.from(state.stations.values()), [state.stations]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>駅需要予測</Text>
        {state.isOnline ? (
          <Text style={styles.statusOnline}>● オンライン</Text>
        ) : (
          <Text style={styles.statusOffline}>● オフライン</Text>
        )}
      </View>

      {state.error && (
        <StatusMessage
          message={`API エラー: 通信に失敗しましたが、モックデータで動作を継続します。 (${state.error.message})`}
          type="info" // エラー画面にならないようにinfoに変更
        />
      )}

      {state.loading && stationList.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      ) : stationList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>駅データが利用できません</Text>
          <StatusMessage
            message="リフレッシュボタンを押してデータを再取得してください"
            type="info"
          />
        </View>
      ) : (
        <FlatList
          data={stationList}
          renderItem={renderStationCard}
          keyExtractor={(item) => item.stationId.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3498DB"
            />
          }
        />
      )}
    </View>
  );
};

/**
 * スタイル定義
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusOnline: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  statusOffline: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyText: {
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareHintIcon: {
    marginRight: 6,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  trendIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  demandContainer: {
    height: 24,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  demandBar: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  demandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  riskBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  statsText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  fareHintText: {
    marginTop: 4,
    fontSize: 11,
    color: '#3498DB',
    fontWeight: '600',
  },
  statusMessage: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  errorMessage: {
    backgroundColor: '#FADBD8',
  },
  infoMessage: {
    backgroundColor: '#D6EAF8',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#C0392B',
  },
  infoText: {
    color: '#1B4965',
  },
});

export default StationDemandScreen;
