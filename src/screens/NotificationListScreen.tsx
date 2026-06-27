import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { requestMapFocus } from '@/services/mapFocusStore';
import { useNotifications } from '@/state/notificationStore';
import type { AppNotificationRecord } from '@/types/notificationList';
import {
  formatNotificationTime,
  parseNotificationForList,
} from '@/utils/notificationDisplay';
import { resolveNotificationLocation } from '@/utils/notificationLocation';

const ACCENT_COLOR = '#2196F3';

export function NotificationListScreen(): React.ReactElement {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

  const handleOpenOnMap = useCallback(
    (item: AppNotificationRecord) => {
      const location = resolveNotificationLocation(item);
      if (!location) {
        Alert.alert('地図を表示できません', 'この通知の位置情報が見つかりませんでした。');
        return;
      }
      requestMapFocus(location);
      router.push('/');
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotificationRecord }) => {
      const row = parseNotificationForList(item);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          delayLongPress={400}
          onPress={() => markRead(item.id)}
          onLongPress={() => handleOpenOnMap(item)}
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: item.read ? 'transparent' : ACCENT_COLOR,
              opacity: item.read ? 0.7 : 1,
            },
          ]}>
          <View style={styles.cardHeader}>
            <ThemedText type="small" style={styles.category}>
              {row.demandLevelLabel || row.typeLabel}
            </ThemedText>
            <View style={styles.cardHeaderRight}>
              {row.predictedDemand != null && (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  需要: {row.predictedDemand}%
                </ThemedText>
              )}
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatNotificationTime(item.receivedAt)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="default" style={styles.placeName}>
            {row.marker ? `${row.marker} ` : ''}
            {row.placeName}
          </ThemedText>

          {row.infoLine.length > 0 && (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {row.infoLine}
            </ThemedText>
          )}

          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      );
    },
    [markRead, handleOpenOnMap, theme]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            通知
          </ThemedText>
          {unreadCount > 0 && (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              未読 {unreadCount}件
            </ThemedText>
          )}
        </View>

        {notifications.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={markAllRead} style={styles.actionButton}>
              <ThemedText type="small">すべて既読</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
              <ThemedText type="small" style={{ color: '#F44336' }}>
                一覧をクリア
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyBox}>
              <ThemedText type="default">通知はまだありません</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                需要ブーストや高需要エリアの通知がここに表示されます。長押しで地図を開けます。
              </ThemedText>
            </ThemedView>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  actionButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.two,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    color: ACCENT_COLOR,
    fontWeight: '600',
    flexShrink: 1,
  },
  placeName: {
    lineHeight: 22,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_COLOR,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    padding: Spacing.four,
  },
});
