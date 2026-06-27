import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { MASTER_VENUE_LIST } from '@/data/masterVenueList';
import { getVenueCoordinate } from '@/data/venueCoordinates';
import { getHotelRegistryEntry } from '@/data/hotelRegistry';
import type { MasterVenue } from '@/types/venueNotification';
import type { NearbyBusinessChainLocation } from '@/types/businessChain';
import { requestMapFocus } from '@/services/mapFocusStore';
import { buildVenueMapFocus } from '@/utils/venueMapFocus';
import { locationService } from '@/services/LocationService';
import { getNotificationSettings } from '@/services/notificationSettingsStore';
import { findNearbyBusinessChainLocations } from '@/services/businessChainNearbyService';
import { discoverBusinessChainsNear } from '@/services/businessChainDiscoveryService';
import { getDiscoveredCount } from '@/services/businessChainLocationStore';

const ACCENT_COLOR = '#2196F3';

function venueTypeLabel(type: MasterVenue['type']): string {
  return type === 'hotel' ? 'ホテル' : '会場';
}

function venueSubline(venue: MasterVenue): string {
  if (venue.type !== 'hotel') {
    return venueTypeLabel(venue.type);
  }
  const hotel = getHotelRegistryEntry(venue.name);
  if (!hotel) {
    return venueTypeLabel(venue.type);
  }
  const tierLabel = hotel.tier === 'luxury' ? 'Luxury' : 'Standard';
  return `${tierLabel} · IN ${hotel.checkInTime} / OUT ${hotel.checkOutTime}`;
}

export function VenueListScreen(): React.ReactElement {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const router = useRouter();

  const [nearbyChains, setNearbyChains] = useState<NearbyBusinessChainLocation[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  const venues = useMemo(
    () =>
      [...MASTER_VENUE_LIST].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'hotel' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'ja');
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    const loadNearby = async () => {
      setLoadingNearby(true);
      const radiusKm = getNotificationSettings().searchRadiusKm;
      const loc = await locationService.getCurrentLocationAsync();

      if (loc) {
        void discoverBusinessChainsNear(loc.latitude, loc.longitude, radiusKm);
      }

      if (loc && !cancelled) {
        const nearby = await findNearbyBusinessChainLocations(
          loc.latitude,
          loc.longitude,
          radiusKm
        );
        setNearbyChains(nearby);
      } else if (!cancelled) {
        setNearbyChains([]);
      }

      const count = await getDiscoveredCount();
      if (!cancelled) {
        setDiscoveredCount(count);
        setLoadingNearby(false);
      }
    };

    void loadNearby();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenOnMap = useCallback(
    (venue: MasterVenue) => {
      const focus = buildVenueMapFocus(venue.name);
      if (!focus) {
        Alert.alert('地図を表示できません', `${venue.name} の位置情報が未登録です。`);
        return;
      }
      requestMapFocus(focus);
      router.push('/');
    },
    [router]
  );

  const handleOpenChainOnMap = useCallback(
    (loc: NearbyBusinessChainLocation) => {
      requestMapFocus({
        label: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      router.push('/');
    },
    [router]
  );

  const renderVenueItem = useCallback(
    ({ item }: { item: MasterVenue }) => {
      const coordinate = getVenueCoordinate(item.name);
      const hasCoordinate = coordinate != null;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleOpenOnMap(item)}
          style={[
            styles.row,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: hasCoordinate ? 'transparent' : '#F44336',
            },
          ]}>
          <View style={styles.rowMain}>
            <ThemedText type="default" style={styles.venueName}>
              🔴 {item.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {venueSubline(item)}
            </ThemedText>
            {getHotelRegistryEntry(item.name) && (
              <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {getHotelRegistryEntry(item.name)?.address}
              </ThemedText>
            )}
          </View>
          <ThemedText type="small" style={styles.mapLink}>
            地図 →
          </ThemedText>
        </TouchableOpacity>
      );
    },
    [handleOpenOnMap, theme.backgroundElement, theme.textSecondary]
  );

  const renderChainItem = useCallback(
    ({ item }: { item: NearbyBusinessChainLocation }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenChainOnMap(item)}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.rowMain}>
          <ThemedText type="default" style={styles.venueName}>
            🏨 {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.chainDisplayName} · OUT 10:00 · {item.distanceKm.toFixed(1)} km
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.mapLink}>
          地図 →
        </ThemedText>
      </TouchableOpacity>
    ),
    [handleOpenChainOnMap, theme.backgroundElement, theme.textSecondary]
  );

  const sections = useMemo(
    () => [
      {
        title: `近くのビジネスチェーン（半径 ${getNotificationSettings().searchRadiusKm} km）`,
        data: nearbyChains,
        key: 'chains',
      },
      {
        title: `登録ホテル・会場（${venues.length} 件）`,
        data: venues,
        key: 'venues',
      },
    ],
    [nearbyChains, venues]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText type="default" style={styles.backText}>
            ← 設定に戻る
          </ThemedText>
        </TouchableOpacity>
        <ThemedText type="title">施設一覧</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          タップで地図に表示 · 蓄積店舗 {discoveredCount} 件
        </ThemedText>
        {loadingNearby && (
          <ActivityIndicator size="small" color={ACCENT_COLOR} style={styles.loader} />
        )}
      </View>
      <SectionList
        sections={sections}
        renderSectionFooter={({ section }) =>
          section.key === 'chains' && section.data.length === 0 && !loadingNearby ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.two }}>
              半径内のビジネスチェーンはありません（走行・施設一覧表示で OSM から蓄積）
            </ThemedText>
          ) : null
        }
        keyExtractor={(item) => ('chainId' in item ? item.id : item.name)}
        renderSectionHeader={({ section }) => (
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {section.title}
          </ThemedText>
        )}
        renderItem={({ item, section }) =>
          section.key === 'chains'
            ? renderChainItem({ item: item as NearbyBusinessChainLocation })
            : renderVenueItem({ item: item as MasterVenue })
        }
        ListEmptyComponent={null}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        stickySectionHeadersEnabled={false}
        initialNumToRender={100}
        windowSize={21}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.one,
  },
  backText: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  loader: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  venueName: {
    fontWeight: '600',
  },
  mapLink: {
    color: ACCENT_COLOR,
    fontWeight: '700',
    marginLeft: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
  sectionGap: {
    height: Spacing.three,
  },
});
