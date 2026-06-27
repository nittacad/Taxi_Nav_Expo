import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme, AppState, AppStateStatus, Alert, Modal, TouchableOpacity, findNodeHandle, UIManager } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { MapPin } from '../components/MapPin';
import { Timer } from '../components/Timer';
import { PinDropFAB } from '../components/PinDropFAB';
import { NotificationFocusMarker } from '../components/NotificationFocusMarker';
import { FocusDestinationButton } from '../components/FocusDestinationButton';
import { locationService, LocationData } from '../services/LocationService';
import { notificationEngine } from '../services/NotificationEngine';
import { consumeMapFocus, subscribeMapFocus, type MapFocusTarget } from '../services/mapFocusStore';
import { getNotificationSettings } from '../services/notificationSettingsStore';
import { getStationCoordinate } from '../data/stationCoordinates';
import { getVenueCoordinate } from '../data/venueCoordinates';
import { useDemand } from '../state/demandStore';
import { CustomerState, FlowState, TaxiMark, TaxiStatus, RealtimePinData, Station, StationDemand } from '../types';

// 初期位置: 東京駅 (docs/expo_migration_spec.md に準拠)
const INITIAL_REGION: Region = {
  latitude: 35.681236,
  longitude: 139.767125,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// モックデータ（Station ID マッピング対応）
const MOCK_STATIONS = [
  { id: '1', title: '東京駅', facilityType: 'station', coordinate: { latitude: 35.681236, longitude: 139.767125 }, demandScore: 45, color: '#F44336' },
  { id: '2', title: '新宿駅', facilityType: 'station', coordinate: { latitude: 35.690921, longitude: 139.700258 }, demandScore: 30, color: '#FF9800' },
  { id: '3', title: '品川駅', facilityType: 'station', coordinate: { latitude: 35.628471, longitude: 139.738760 }, demandScore: 12, color: '#4CAF50' },
  { id: '4', title: '渋谷駅', facilityType: 'station', coordinate: { latitude: 35.658034, longitude: 139.701636 }, demandScore: 60, color: '#FF9800' },
  { id: '5', title: '池袋駅', facilityType: 'station', coordinate: { latitude: 35.729503, longitude: 139.710900 }, demandScore: 55, color: '#FF9800' },
  { id: '6', title: '上野駅', facilityType: 'station', coordinate: { latitude: 35.713768, longitude: 139.777254 }, demandScore: 40, color: '#4CAF50' },
  { id: '7', title: '新橋駅', facilityType: 'station', coordinate: { latitude: 35.666379, longitude: 139.758331 }, demandScore: 75, color: '#F44336' },
  { id: '8', title: '秋葉原駅', facilityType: 'station', coordinate: { latitude: 35.698353, longitude: 139.773114 }, demandScore: 45, color: '#FF9800' },
  { id: '9', title: '浜松町駅', facilityType: 'station', coordinate: { latitude: 35.655381, longitude: 139.757129 }, demandScore: 30, color: '#4CAF50' },
  { id: '10', title: '日暮里駅', facilityType: 'station', coordinate: { latitude: 35.728157, longitude: 139.770641 }, demandScore: 25, color: '#4CAF50' },
  
  { id: '101', title: '帝国ホテル', facilityType: 'hotel', coordinate: { latitude: 35.6723, longitude: 139.7584 }, demandScore: 90, color: '#F44336' },
  { id: '102', title: 'ホテルニューオータニ', facilityType: 'hotel', coordinate: { latitude: 35.6751, longitude: 139.7289 }, demandScore: 75, color: '#F44336' },
  { id: '103', title: 'ヒルトン東京', facilityType: 'hotel', coordinate: { latitude: 35.6923, longitude: 139.6905 }, demandScore: 50, color: '#FF9800' },
  { id: '104', title: '三井ガーデンホテル渋谷', facilityType: 'hotel', coordinate: { latitude: 35.6601, longitude: 139.7015 }, demandScore: 40, color: '#4CAF50' },
  { id: '105', title: 'ホテルメトロポリタン', facilityType: 'hotel', coordinate: { latitude: 35.6842, longitude: 139.7671 }, demandScore: 30, color: '#4CAF50' },
  { id: '106', title: '東京ビジネスホテルチェーン', facilityType: 'hotel', coordinate: { latitude: 35.6770, longitude: 139.7650 }, demandScore: 20, color: '#4CAF50' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【Marker コンテナ設計 v2 — 極小ピン + 右横バブル】
//
//  コンテナ: 100 × 90 pt
//    赤ドット (8×8): absolute left=6, top=6 → center=(10, 10)
//    波紋 (16×16):   absolute left=2, top=2  → center=(10, 10) ✓
//    バブル:          absolute left=20, top=1 (ドットの右横)
//    アンカー点 = ドット center + (40, 80) = (50, 90) = コンテナ下端中央
//
//  Android anchor = { x: 0.5, y: 1.0 }
//    → アンカー点 (50,90) が指に追従 → dot center = 指の左40・上80pt ✓
//
//  iOS centerOffset = { x: 0, y: -45 }
//    → view center = (50,45) を coord + (0,-45) に配置
//    → dot center = coord + (0,-45) + (10-50, 10-45) = coord + (-40, -80) ✓
//
//  FAB clone (CLONE_W=60, CLONE_H=100) の左上オフセット (-40, -80) を継承。
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 記録時刻からの経過時間に応じて鮮度カラーを返す。
 * 緑(新鮮) → 黄 → オレンジ → 赤(古い)
 */
const getFreshnessColor = (recordedAt: number): string => {
  const ageMin = (Date.now() - recordedAt) / 60_000;
  if (ageMin < 2)  return '#4CAF50'; // 緑: 作成直後
  if (ageMin < 5)  return '#FFC107'; // 黄: 数分経過
  if (ageMin < 10) return '#FF9800'; // オレンジ: やや古い
  return '#F44336';                   // 赤: 古い
};

/**
 * 経過時間に応じてマーカーの不透明度を返す（古いほど薄くなる）
 */
const getFreshnessOpacity = (recordedAt: number): number => {
  const ageMin = (Date.now() - recordedAt) / 60_000;
  if (ageMin < 10) return 1.0;
  if (ageMin < 20) return 0.7;
  return 0.4;
};

// ピンのラベル生成ロジック
const getPinLabel = (pin: RealtimePinData): string => {
  const parts: string[] = [];
  
  // 1. 人
  if (pin.customer !== CustomerState.none) parts.push(pin.customer);
  
  // 2. タクシー
  const isTaxiEmpty = pin.taxi.count === 0 && pin.taxi.mark === TaxiMark.none;
  if (!isTaxiEmpty) {
    if (pin.taxi.mark === TaxiMark.full) parts.push('🚕🈵');
    else if (pin.taxi.mark === TaxiMark.overflow) parts.push('🚕🈵～');
    else if (pin.taxi.count > 0) parts.push(`🚕${pin.taxi.count}`);
  }
  
  // 3. 流れ
  if (pin.flow !== FlowState.normal) parts.push(pin.flow);
  
  return parts.join('');
};

export const MapScreen: React.FC = () => {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  
  const mapRef = useRef<MapView>(null);
  const hasCenteredOnUserRef = useRef(false);
  const { state: demandState, fetchDemandByBounds } = useDemand();
  const demandStateRef = useRef(demandState);
  demandStateRef.current = demandState;
  // MapView の画面絶対座標（左上隅）を記録する ref。
  const mapOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [droppedPins, setDroppedPins] = useState<RealtimePinData[]>([]);
  const [focusHighlight, setFocusHighlight] = useState<MapFocusTarget | null>(null);
  const [focusPulseDone, setFocusPulseDone] = useState(false);

  const runNotificationChecks = useCallback(async (loc: LocationData) => {
    const demands = Array.from(demandStateRef.current.stations.values());
    const stations = demands.map((demand) => {
      const coordinate = getStationCoordinate(demand.stationId) ?? {
        latitude: INITIAL_REGION.latitude,
        longitude: INITIAL_REGION.longitude,
      };
      return {
        id: demand.stationId,
        name: demand.stationName,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        region: 'Kanto',
      };
    });
    await notificationEngine.checkAllNotifications(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: 0,
        timestamp: Date.now(),
      },
      stations,
      demands,
      getNotificationSettings().searchRadiusKm
    );
  }, []);
  
  // マニュアル入力用モーダルの状態
  const [isPinInputVisible, setIsPinInputVisible] = useState(false);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editTaxiCount, setEditTaxiCount] = useState(0);
  const [editTaxiMark, setEditTaxiMark] = useState<TaxiMark>(TaxiMark.none);
  const [editCustomer, setEditCustomer] = useState<CustomerState>(CustomerState.none);
  const [editFlow, setEditFlow] = useState<FlowState>(FlowState.normal);
  
  // 鮮度カラー更新用タイマー（30秒ごとに再レンダリングして色変化を反映）
  const [, setFreshnessTick] = useState(0);
  useEffect(() => {
    const freshnessClock = setInterval(() => setFreshnessTick(t => t + 1), 30_000);
    return () => clearInterval(freshnessClock);
  }, []);

  // 駅データを取得するためのロジック（現在位置をベースに周辺の情報を取得）
  const updateDemandsBasedOnLocation = async (loc: LocationData) => {
    // 現在地を中心とした矩形領域を計算 (簡易的におよそ数kmの範囲)
    const offset = 0.05; // 約5km
    await fetchDemandByBounds({
      minLat: loc.latitude - offset,
      maxLat: loc.latitude + offset,
      minLng: loc.longitude - offset,
      maxLng: loc.longitude + offset,
    });
  };

  useEffect(() => {
    const centerMapOnUserOnce = (loc: LocationData) => {
      if (hasCenteredOnUserRef.current) return;
      hasCenteredOnUserRef.current = true;
      mapRef.current?.animateToRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };

    const initLocation = async () => {
      const initialLoc = await locationService.getCurrentLocationAsync();
      if (initialLoc) {
        setCurrentLocation(initialLoc);
        updateDemandsBasedOnLocation(initialLoc);
        void runNotificationChecks(initialLoc);
        centerMapOnUserOnce(initialLoc);
      }

      await locationService.startLocationUpdatesAsync((loc) => {
        setCurrentLocation(loc);
        updateDemandsBasedOnLocation(loc);
        void runNotificationChecks(loc);
      });
    };

    initLocation();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // バックグラウンド時のリソース調整用フック
      }
    });

    return () => {
      subscription.remove();
      locationService.stopLocationUpdates();
    };
  }, [fetchDemandByBounds, runNotificationChecks]);

  const applyMapFocus = useCallback((focus: MapFocusTarget) => {
    hasCenteredOnUserRef.current = true;
    setFocusHighlight(focus);
    setFocusPulseDone(false);
    mapRef.current?.animateToRegion({
      latitude: focus.latitude,
      longitude: focus.longitude,
      latitudeDelta: focus.latitudeDelta ?? 0.02,
      longitudeDelta: focus.longitudeDelta ?? 0.02,
    });
  }, []);

  const handleFocusPulseFinished = useCallback(() => {
    setFocusPulseDone(true);
  }, []);

  const clearFocusHighlight = useCallback(() => {
    setFocusHighlight(null);
    setFocusPulseDone(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMapFocus(applyMapFocus);
    const pending = consumeMapFocus();
    if (pending) {
      applyMapFocus(pending);
    }
    return unsubscribe;
  }, [applyMapFocus]);

  // Map上のステーション描画用データ
  // MOCK_STATIONS を demandStore の状態から取得するデータに切り替え、不足時はフォールバック
  const stationsToDisplay = React.useMemo(() => {
    return demandState.stations.size > 0 
      ? Array.from(demandState.stations.values()).map(d => {
          const mockMatch = MOCK_STATIONS.find(s => String(s.id) === String(d.stationId));
          const venueCoordinate = getVenueCoordinate(d.stationName);
          return {
            id: String(d.stationId),
            title: d.stationName,
            coordinate: venueCoordinate ??
              mockMatch?.coordinate ?? { latitude: 35.681236, longitude: 139.767125 },
            demandScore: d.predictedDemand,
            color: d.riskLevel === 'high' ? '#F44336' : d.riskLevel === 'medium' ? '#FF9800' : '#4CAF50'
          };
        })
      : MOCK_STATIONS;
  }, [demandState.stations]);

  const handleDropPin = async (absX: number, absY: number) => {
    if (!mapRef.current) return;
    
    try {
      // absX/absY は gesture-handler が返す「ウィンドウ絶対座標」（ステータスバー込みの原点(0,0) 基準）。
      // coordinateForPoint は MapView ローカル座標（MapView 左上 = (0,0)）を期待するため、
      // onLayout で measureInWindow した MapView の絶対オフセットを引いて変換する。
      const x = absX - mapOrigin.current.x;
      const y = absY - mapOrigin.current.y;
      const coordinate = await mapRef.current.coordinateForPoint({ x, y });
      
      // 新しいピンを状態に追加
      const newPinId = `dropped_pin_${Date.now()}`;
      setDroppedPins(prev => [
        ...prev,
        {
          id: newPinId,
          coordinate,
          recordedAt: Date.now(),
          taxi: { count: 0, mark: TaxiMark.none },
          customer: CustomerState.none,
          flow: FlowState.normal,
        }
      ]);

      // モーダルを開いて手入力を促す
      setEditingPinId(newPinId);
      setEditTaxiCount(0);
      setEditTaxiMark(TaxiMark.none);
      setEditCustomer(CustomerState.none);
      setEditFlow(FlowState.normal);
      setIsPinInputVisible(true);

      // TODO: 音声入力 (expo-speech 等) を並行して開始する処理

    } catch (e) {
      console.error('Failed to convert point to coordinate', e);
    }
  };

  const handleSavePin = () => {
    setDroppedPins(prev => prev.map(pin => {
      if (pin.id === editingPinId) {
        return { 
          ...pin, 
          taxi: { count: editTaxiCount, mark: editTaxiMark },
          customer: editCustomer,
          flow: editFlow
        };
      }
      return pin;
    }));
    setIsPinInputVisible(false);
    setEditingPinId(null);
  };

  const handleDeletePin = () => {
    // 削除を選択した場合はピンを削除する
    setDroppedPins(prev => prev.filter(pin => pin.id !== editingPinId));
    setIsPinInputVisible(false);
    setEditingPinId(null);
  };

  const handleCancelEdit = () => {
    // キャンセルの場合は単にモーダルを閉じる
    setIsPinInputVisible(false);
    setEditingPinId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NativeViewGestureHandler disallowInterruption>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={false}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
          mapPadding={{
            top: insets.top,
            right: 0,
            bottom: 0,
            left: 0,
          }}
          onLayout={() => {
            // MapView がレイアウト完了した後、画面絶対座標を取得する。
            // requestAnimationFrame でネイティブレイアウトの確定を1フレーム待つ。
            requestAnimationFrame(() => {
              const node = findNodeHandle(mapRef.current);
              if (node !== null) {
                UIManager.measureInWindow(node, (pageX, pageY) => {
                  mapOrigin.current = { x: pageX, y: pageY };
                });
              }
            });
          }}
        >
        {/* 現在地の描画は showsUserLocation でカバーされるが、必要に応じて明示的マーカーを追加しても良い */}
        
        {stationsToDisplay.map((station) => (
          <MapPin
            key={station.id}
            coordinate={station.coordinate}
            title={station.title}
            demandScore={station.demandScore}
            color={station.color}
            facilityType={(station as any).facilityType || 'station'}
          />
        ))}

        {focusHighlight && !focusPulseDone && (
          <NotificationFocusMarker
            key={`${focusHighlight.latitude},${focusHighlight.longitude},${focusHighlight.label}`}
            latitude={focusHighlight.latitude}
            longitude={focusHighlight.longitude}
            label={focusHighlight.label}
            onFinished={handleFocusPulseFinished}
          />
        )}

        {/* ユーザーがドロップした動的ピン（音声入力用） */}
        {droppedPins.map((pin) => {
          const pinColor = getFreshnessColor(pin.recordedAt);
          const pinOpacity = getFreshnessOpacity(pin.recordedAt);
          const pinLabel = getPinLabel(pin) || '🎙️...';
          return (
            <Marker
              key={pin.id}
              coordinate={pin.coordinate}
              draggable
              // 【オフセット設計 v2】極小ピン + 右横バブル（左上オフセット継承）
              //
              // コンテナ (100 × 90 pt):
              //   波紋 (16×16): absolute left=2, top=2 → center=(10,10)
              //   赤ドット (8×8): absolute left=6, top=6 → center=(10,10)
              //   バブル: absolute left=20, top=1 (ドット右横)
              //   アンカー点 = (50, 90) = コンテナ下端中央
              //
              // Android anchor={x:0.5, y:1.0}: 点(50,90)が指に追従
              //   → dot center = (指X−40, 指Y−80) ✓
              // iOS centerOffset={x:0, y:−45}: view center を coord+(0,−45) に配置
              //   → dot center = coord+(0,−45)+(10−50,10−45) = coord+(−40,−80) ✓
              anchor={{ x: 0.5, y: 1.0 }}
              centerOffset={{ x: 0, y: -45 }}
              onDragEnd={(e) => {
                const newCoord = e.nativeEvent.coordinate;
                setDroppedPins(prev => prev.map(p => p.id === pin.id ? { ...p, coordinate: newCoord } : p));
              }}
              onPress={() => {
                setEditingPinId(pin.id);
                setEditTaxiCount(pin.taxi.count);
                setEditTaxiMark(pin.taxi.mark);
                setEditCustomer(pin.customer);
                setEditFlow(pin.flow);
                setIsPinInputVisible(true);
              }}
            >
              <View style={[styles.droppedPinContainer, { opacity: pinOpacity }]}>
                {/* 波紋: ドットを囲む控えめなリング */}
                <View style={[styles.rippleEffect, { borderColor: pinColor }]} />
                {/* 赤ドット: 極小・鮮度カラー */}
                <View style={[styles.droppedPinInner, { backgroundColor: pinColor }]} />
                {/* 吹き出し: ドットの右横に配置 */}
                <View style={[styles.droppedPinTextBubble, { borderColor: pinColor }]}>
                  <Text style={styles.bubbleText}>{pinLabel}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
        </MapView>
      </NativeViewGestureHandler>
      
      {/* タイマー（右上のみ・地図のタッチを遮らない） */}
      <View style={[styles.timerOverlay, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View pointerEvents="auto">
          <Timer initialSeconds={120} />
        </View>
      </View>

      {/* 通知フォーカス後: ナビ目的地ボタン */}
      {focusHighlight && focusPulseDone && (
        <View style={[styles.destinationOverlay, { bottom: insets.bottom + 24 }]} pointerEvents="box-none">
          <FocusDestinationButton
            label={focusHighlight.label}
            latitude={focusHighlight.latitude}
            longitude={focusHighlight.longitude}
            onDismiss={clearFocusHighlight}
          />
        </View>
      )}

      {/* ドラッグ可能なピン投下ボタン (FAB) — 地図タッチを遮らない */}
      <View style={styles.fabOverlay} pointerEvents="box-none">
        <PinDropFAB 
          onDropPin={handleDropPin} 
          onActionSelect={(action) => {
            Alert.alert('メニュー操作', `${action} が選択されました`);
          }} 
        />
      </View>

      {/* マニュアル入力用モーダル */}
      <Modal visible={isPinInputVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍ピン情報の編集</Text>

            {/* 客: 絵文字トグルのみ（再タップで解除） */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>👤</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.toggleBtn, editCustomer === CustomerState.present && styles.toggleBtnActive]}
                  onPress={() => setEditCustomer(editCustomer === CustomerState.present ? CustomerState.none : CustomerState.present)}>
                  <Text style={styles.emojiText}>🙋</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editCustomer === CustomerState.group && styles.toggleBtnActive]}
                  onPress={() => setEditCustomer(editCustomer === CustomerState.group ? CustomerState.none : CustomerState.group)}>
                  <Text style={styles.emojiText}>👫</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editCustomer === CustomerState.zombie && styles.toggleBtnActive]}
                  onPress={() => setEditCustomer(editCustomer === CustomerState.zombie ? CustomerState.none : CustomerState.zombie)}>
                  <Text style={styles.emojiText}>🧟</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* タクシー: 台数ステッパー + 🈵/～ トグル */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>🚕</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperButton} onPress={() => setEditTaxiCount(Math.max(0, editTaxiCount - 1))}>
                  <Text style={styles.stepperText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{editTaxiCount}</Text>
                <TouchableOpacity style={styles.stepperButton} onPress={() => setEditTaxiCount(editTaxiCount + 1)}>
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.buttonGroup, { marginLeft: 8, justifyContent: 'flex-start' }]}>
                <TouchableOpacity
                  style={[styles.toggleBtn, editTaxiMark === TaxiMark.full && styles.toggleBtnActive]}
                  onPress={() => setEditTaxiMark(editTaxiMark === TaxiMark.full ? TaxiMark.none : TaxiMark.full)}>
                  <Text style={styles.emojiText}>🈵</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editTaxiMark === TaxiMark.overflow && styles.toggleBtnActive]}
                  onPress={() => setEditTaxiMark(editTaxiMark === TaxiMark.overflow ? TaxiMark.none : TaxiMark.overflow)}>
                  <Text style={styles.emojiText}>～</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 流れ: 絵文字トグルのみ（再タップで解除） */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>🌊</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.toggleBtn, editFlow === FlowState.good && styles.toggleBtnActive]}
                  onPress={() => setEditFlow(editFlow === FlowState.good ? FlowState.normal : FlowState.good)}>
                  <Text style={styles.emojiText}>🐇</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editFlow === FlowState.slow && styles.toggleBtnActive]}
                  onPress={() => setEditFlow(editFlow === FlowState.slow ? FlowState.normal : FlowState.slow)}>
                  <Text style={styles.emojiText}>🐢</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, editFlow === FlowState.stopped && styles.toggleBtnActive]}
                  onPress={() => setEditFlow(editFlow === FlowState.stopped ? FlowState.normal : FlowState.stopped)}>
                  <Text style={styles.emojiText}>💤</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleDeletePin}>
                <Text style={styles.cancelButtonText}>削除</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { backgroundColor: '#e0e0e0' }]} onPress={handleCancelEdit}>
                <Text style={[styles.cancelButtonText, { color: '#333' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSavePin}>
                <Text style={styles.saveButtonText}>反映</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  timerOverlay: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  destinationOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  // ドロップしたピンのコンテナ (100 × 90 pt) v2
  // anchor=(0.5, 1.0) / centerOffset=(0, -45) と対になる設計。
  // dot center (10, 10) から anchor (50, 90) まで: 右40・下80pt → 指の左40・上80pt ✓
  droppedPinContainer: {
    width: 100,
    height: 90,
    // 子要素は absolute で配置するため center 指定なし
  },
  // 極小赤ドット: left=6, top=6 → center=(10,10) in container
  droppedPinInner: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor は鮮度カラーで動的に設定
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  // 波紋: ドットを囲む薄いリング。left=2, top=2 → center=(10,10) ✓
  rippleEffect: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    // borderColor は鮮度カラーで動的に設定
    backgroundColor: 'transparent',
    opacity: 0.6,
  },
  // 吹き出し: ドット右横配置 (left=20, top=1)
  droppedPinTextBubble: {
    position: 'absolute',
    top: 1,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    // borderColor は鮮度カラーで動的に設定
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 4,
  },
  bubbleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  emojiText: {
    fontSize: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  stepperButton: {
    padding: 10,
  },
  stepperText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  stepperValue: {
    fontSize: 18,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
