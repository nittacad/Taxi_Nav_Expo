import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Button, Alert, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MASTER_VENUE_LIST } from '@/data/masterVenueList';
import { BUSINESS_CHAIN_REGISTRY } from '@/data/businessChainRegistry';
import { getMeetingCount, getMeetingsOnDate } from '@/data/shareholderMeetingSchedule';
import {
  refreshShareholderMeetingSchedule,
} from '@/services/shareholderMeetingRemoteStore';
import { demandApiClient } from '@/services/DemandAPIClient';
import { notificationEngine } from '@/services/NotificationEngine';
import { shareholderMeetingNotificationEngine } from '@/services/ShareholderMeetingNotificationEngine';
import { DemandPriority } from '@/types/venueNotification';
import {
  getNotificationSettings,
  subscribeNotificationSettings,
  updateNotificationSettings,
} from '@/services/notificationSettingsStore';
import {
  NOTIFICATION_TEST_PRESETS,
  buildTestDate,
  type NotificationTestPreset,
} from '@/data/notificationTestPresets';
import { Spacing } from '@/constants/theme';

function formatTestTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [radius, setRadius] = useState(String(getNotificationSettings().searchRadiusKm));
  const [businessChainEnabled, setBusinessChainEnabled] = useState(
    getNotificationSettings().businessChainNotificationsEnabled
  );
  const [shareholderMeetingEnabled, setShareholderMeetingEnabled] = useState(
    getNotificationSettings().shareholderMeetingNotificationsEnabled
  );
  const [pickupLat, setPickupLat] = useState('35.681236');
  const [pickupLng, setPickupLng] = useState('139.767125');
  const [dropoffLat, setDropoffLat] = useState('35.658034');
  const [dropoffLng, setDropoffLng] = useState('139.701636');
  const [time, setTime] = useState(new Date().toISOString());

  const [testLat, setTestLat] = useState('35.6750');
  const [testLng, setTestLng] = useState('139.7709');
  const [testHour, setTestHour] = useState('11');
  const [testMinute, setTestMinute] = useState('30');
  const [ignoreDistance, setIgnoreDistance] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('imperial_checkout');
  const [agmSyncLabel, setAgmSyncLabel] = useState('同梱データ');

  useEffect(() => {
    void refreshShareholderMeetingSchedule().then((status) => {
      const sourceLabel =
        status.source === 'remote'
          ? 'クラウド最新'
          : status.source === 'cache'
            ? '前回取得分'
            : '同梱データ';
      setAgmSyncLabel(sourceLabel);
    });
  }, []);

  useEffect(() => {
    return subscribeNotificationSettings((settings) => {
      setRadius(String(settings.searchRadiusKm));
      setBusinessChainEnabled(settings.businessChainNotificationsEnabled);
      setShareholderMeetingEnabled(settings.shareholderMeetingNotificationsEnabled);
    });
  }, []);

  const handleRadiusChange = (value: string) => {
    setRadius(value);
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      updateNotificationSettings({ searchRadiusKm: parsed });
    }
  };

  const handleBusinessChainToggle = (value: boolean) => {
    setBusinessChainEnabled(value);
    updateNotificationSettings({ businessChainNotificationsEnabled: value });
  };

  const handleShareholderMeetingToggle = (value: boolean) => {
    setShareholderMeetingEnabled(value);
    updateNotificationSettings({ shareholderMeetingNotificationsEnabled: value });
  };

  const applyPreset = (preset: NotificationTestPreset) => {
    setSelectedPresetId(preset.id);
    setTestLat(String(preset.latitude));
    setTestLng(String(preset.longitude));
    setTestHour(String(preset.hour));
    setTestMinute(String(preset.minute));
  };

  const buildTestOptions = () => {
    const hour = Number.parseInt(testHour, 10);
    const minute = Number.parseInt(testMinute, 10);
    const latitude = Number.parseFloat(testLat);
    const longitude = Number.parseFloat(testLng);

    if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const preset = NOTIFICATION_TEST_PRESETS.find((p) => p.id === selectedPresetId);
    const baseDate = preset?.calendarDate
      ? new Date(preset.calendarDate.year, preset.calendarDate.month, preset.calendarDate.day)
      : new Date();

    return {
      latitude,
      longitude,
      at: buildTestDate(hour, minute, baseDate),
      searchRadiusKm: Number.parseFloat(radius) || 5,
      ignoreDistance,
      bypassCooldown: true,
    };
  };

  const handlePreviewVenueBoost = async () => {
    const options = buildTestOptions();
    if (!options) {
      Alert.alert('入力エラー', '緯度・経度・時刻を確認してください');
      return;
    }

    const { boostTargets } = await notificationEngine.runVenueBoostTest({
      ...options,
      dryRun: true,
    });

    const agmTargets = shareholderMeetingNotificationEngine
      .monitorTodayMeetings(options.at)
      .filter((r) => r.is_boost_target && r.priority === DemandPriority.URGENT)
      .map((r) => `${r.company_name}（${r.venue_name}）`);

    Alert.alert(
      'ブースト対象プレビュー',
      `時刻 ${formatTestTime(options.at)}\n` +
        `ホテル/式場: ${boostTargets.length}件\n` +
        boostTargets.slice(0, 5).join('\n') +
        (boostTargets.length > 5 ? `\n…他 ${boostTargets.length - 5}件` : '') +
        `\n\n株主総会: ${agmTargets.length}件\n` +
        agmTargets.slice(0, 5).join('\n')
    );
  };

  const handleRunVenueBoostTest = async () => {
    const options = buildTestOptions();
    if (!options) {
      Alert.alert('入力エラー', '緯度・経度・時刻を確認してください');
      return;
    }

    try {
      notificationEngine.clearVenueNotificationCooldown();
      const result = await notificationEngine.runVenueBoostTest(options);
      await notificationEngine.checkShareholderMeetingNotifications(
        {
          latitude: options.latitude,
          longitude: options.longitude,
          accuracy: 0,
          timestamp: options.at.getTime(),
        },
        options.searchRadiusKm,
        options.at
      );
      Alert.alert(
        '通知テスト完了',
        `送信: ${result.sent.length}件\n` +
          (result.sent.length > 0 ? result.sent.slice(0, 5).join('\n') : '（なし）') +
          (result.skipped.length > 0 ? `\n\nスキップ: ${result.skipped.length}件` : '') +
          '\n\n株主総会通知も半径内なら送信済み'
      );
    } catch (error) {
      Alert.alert('エラー', '通知テストに失敗しました');
      console.error(error);
    }
  };

  const handleRegisterVip = async () => {
    try {
      const response = await demandApiClient.registerVip({
        driver_id: 'D-001',
        pickup_lat: parseFloat(pickupLat),
        pickup_lng: parseFloat(pickupLng),
        dropoff_lat: parseFloat(dropoffLat),
        dropoff_lng: parseFloat(dropoffLng),
        time,
      });
      Alert.alert('Success', `VIP registered! ID: ${response.vip_id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to register VIP');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>設定</ThemedText>

          {__DEV__ && (
            <ThemedView style={styles.devSection}>
              <ThemedText type="subtitle">🔧 ホテル通知テスト（開発用）</ThemedText>
              <ThemedText type="small">
                現在地・時刻をシミュレートして Module A 通知を試せます。Expo Go 実機向け。
              </ThemedText>

              <ThemedText type="default">プリセット</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
                {NOTIFICATION_TEST_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetChip,
                      selectedPresetId === preset.id && styles.presetChipActive,
                    ]}
                    onPress={() => applyPreset(preset)}>
                    <ThemedText type="small">{preset.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ThemedText type="small">
                {NOTIFICATION_TEST_PRESETS.find((p) => p.id === selectedPresetId)?.description ?? ''}
              </ThemedText>

              <ThemedText type="default">テスト緯度 / 経度</ThemedText>
              <TextInput style={styles.input} value={testLat} onChangeText={setTestLat} keyboardType="numeric" />
              <TextInput style={styles.input} value={testLng} onChangeText={setTestLng} keyboardType="numeric" />

              <ThemedText type="default">テスト時刻（今日の HH / MM）</ThemedText>
              <ThemedView style={styles.timeRow}>
                <TextInput style={[styles.input, styles.timeInput]} value={testHour} onChangeText={setTestHour} keyboardType="numeric" placeholder="時" />
                <ThemedText type="default">:</ThemedText>
                <TextInput style={[styles.input, styles.timeInput]} value={testMinute} onChangeText={setTestMinute} keyboardType="numeric" placeholder="分" />
              </ThemedView>

              <ThemedView style={styles.switchRow}>
                <ThemedText type="default">GPS距離チェックを無視</ThemedText>
                <Switch value={ignoreDistance} onValueChange={setIgnoreDistance} />
              </ThemedView>

              <Button title="ブースト対象をプレビュー" onPress={handlePreviewVenueBoost} />
              <Button title="通知を送信（テスト）" onPress={handleRunVenueBoostTest} />
            </ThemedView>
          )}

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">施設位置確認</ThemedText>
            <ThemedText type="small">
              通知が来ていないホテル・会場も含め、全 {MASTER_VENUE_LIST.length} 件を地図で確認できます。
            </ThemedText>
            <TouchableOpacity
              style={styles.venueListButton}
              onPress={() => router.push('/venue-list')}>
              <ThemedText type="default" style={styles.venueListButtonText}>
                施設一覧を開く →
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Notification Radius (km)</ThemedText>
            <TextInput
              style={styles.input}
              value={radius}
              onChangeText={handleRadiusChange}
              keyboardType="numeric"
              placeholder="e.g. 3"
              placeholderTextColor="#999"
            />
            <ThemedText type="small">Current Radius: {radius} km</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">株主総会（A-009）</ThemedText>
            <ThemedText type="small">
              当日開催予定の総会について、終了60分前〜終了時刻に半径内で通知（東京都23区・座標付き会場対応）
            </ThemedText>
            <ThemedText type="small">
              スケジュール {getMeetingCount()} 件 · 本日 {getMeetingsOnDate(new Date()).length} 件 · データ源: {agmSyncLabel}
            </ThemedText>
            <ThemedText type="small">
              iPhone は起動時に JSON を自動取得（app.json の shareholderMeetingsJsonUrl）
            </ThemedText>
            <ThemedView style={styles.switchRow}>
              <ThemedText type="default">株主総会通知</ThemedText>
              <Switch value={shareholderMeetingEnabled} onValueChange={handleShareholderMeetingToggle} />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">ビジネスチェーンホテル（CO 10:00）</ThemedText>
            <ThemedText type="small">
              {BUSINESS_CHAIN_REGISTRY.map((c) => c.displayName).join(' / ')}
            </ThemedText>
            <ThemedText type="small">
              9:30〜10:00 の間、上記半径内のチェーン店舗で需要ブースト通知。店舗は走行中に OSM から段階的に蓄積されます（Phase1: 東・都心優先）。
            </ThemedText>
            <ThemedView style={styles.switchRow}>
              <ThemedText type="default">ビジネスチェーン通知</ThemedText>
              <Switch value={businessChainEnabled} onValueChange={handleBusinessChainToggle} />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">VIP Registration</ThemedText>

            <ThemedText type="default">Pickup Latitude</ThemedText>
            <TextInput style={styles.input} value={pickupLat} onChangeText={setPickupLat} keyboardType="numeric" />

            <ThemedText type="default">Pickup Longitude</ThemedText>
            <TextInput style={styles.input} value={pickupLng} onChangeText={setPickupLng} keyboardType="numeric" />

            <ThemedText type="default">Dropoff Latitude</ThemedText>
            <TextInput style={styles.input} value={dropoffLat} onChangeText={setDropoffLat} keyboardType="numeric" />

            <ThemedText type="default">Dropoff Longitude</ThemedText>
            <TextInput style={styles.input} value={dropoffLng} onChangeText={setDropoffLng} keyboardType="numeric" />

            <ThemedText type="default">Time</ThemedText>
            <TextInput style={styles.input} value={time} onChangeText={setTime} />

            <Button title="Register VIP" onPress={handleRegisterVip} />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  title: {
    marginBottom: Spacing.four,
  },
  section: {
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  devSection: {
    marginBottom: Spacing.four,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    backgroundColor: 'rgba(255, 183, 77, 0.12)',
  },
  presetRow: {
    flexGrow: 0,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  presetChipActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueListButton: {
    marginTop: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  venueListButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: Spacing.two,
    borderRadius: 4,
    color: '#333',
    backgroundColor: '#fff',
  },
});
