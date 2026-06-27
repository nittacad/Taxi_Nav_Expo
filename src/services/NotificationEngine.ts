import * as Notifications from 'expo-notifications';
import { VENUE_NOTIFY_RADIUS_KM } from '@/data/masterVenueList';
import { getVenueCoordinate } from '@/data/venueCoordinates';
import { UnifiedNotificationEngine, unifiedNotificationEngine } from '@/services/UnifiedNotificationEngine';
import { discoverBusinessChainsNear } from '@/services/businessChainDiscoveryService';
import {
  findNearbyBusinessChainLocations,
  formatBusinessChainNotificationBody,
} from '@/services/businessChainNearbyService';
import {
  ShareholderMeetingNotificationEngine,
  shareholderMeetingNotificationEngine,
} from '@/services/ShareholderMeetingNotificationEngine';
import { getShareholderMeetingSchedule } from '@/data/shareholderMeetingSchedule';
import { initShareholderMeetingSchedule } from '@/services/shareholderMeetingRemoteStore';
import { resolveShareholderMeetingCoordinate } from '@/utils/shareholderMeetingLocation';
import { getNotificationSettings } from '@/services/notificationSettingsStore';
import { DemandPriority } from '@/types/venueNotification';
import { UserLocation, StationDemand, Station } from '@/types';
import { inferNotificationCategory, recordNotification } from '@/services/notificationHistory';
import { calculateDistanceKm } from '@/utils/geoDistance';
import { isInBusinessChainNotifyWindow } from '@/utils/businessChainTimeWindow';
import type { NotificationCategory } from '@/types/notificationList';

// フォアグラウンド: バナーのみ（中央ポップアップは出さない）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationEngine {
  private readonly venueEngine: UnifiedNotificationEngine;
  private readonly shareholderEngine: ShareholderMeetingNotificationEngine;
  private lastNotifiedStations: Set<number> = new Set();
  private lastNotifiedVenues: Set<string> = new Set();
  private notificationCooldownMs = 15 * 60 * 1000;

  constructor(
    venueEngine: UnifiedNotificationEngine = unifiedNotificationEngine,
    shareholderEngine: ShareholderMeetingNotificationEngine = shareholderMeetingNotificationEngine
  ) {
    this.venueEngine = venueEngine;
    this.shareholderEngine = shareholderEngine;
  }

  /** 開発・実機テスト用: 施設通知のクールダウンをリセット */
  clearVenueNotificationCooldown(): void {
    this.lastNotifiedVenues.clear();
  }

  /**
   * 開発・実機テスト用: 任意の時刻・位置でホテル/式場ブースト通知を試す
   */
  async runVenueBoostTest(options: {
    latitude: number;
    longitude: number;
    at: Date;
    searchRadiusKm?: number;
    ignoreDistance?: boolean;
    bypassCooldown?: boolean;
    dryRun?: boolean;
  }): Promise<{
    boostTargets: string[];
    sent: string[];
    skipped: string[];
  }> {
    const {
      latitude,
      longitude,
      at,
      searchRadiusKm = VENUE_NOTIFY_RADIUS_KM,
      ignoreDistance = false,
      bypassCooldown = true,
      dryRun = false,
    } = options;

    const userLocation: UserLocation = {
      latitude,
      longitude,
      accuracy: 0,
      timestamp: at.getTime(),
    };

    const monitored = this.venueEngine.monitorAllVenues(at);
    const boostTargets = monitored
      .filter((r) => r.is_boost_target && r.priority === DemandPriority.URGENT)
      .map((r) => r.venue_name);

    if (dryRun) {
      return { boostTargets, sent: [], skipped: [] };
    }

    if (bypassCooldown) {
      this.clearVenueNotificationCooldown();
    }

    const sent: string[] = [];
    const skipped: string[] = [];

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return { boostTargets, sent, skipped: boostTargets };
    }

    for (const result of monitored) {
      if (!result.is_boost_target || result.priority !== DemandPriority.URGENT) continue;
      if (!result.notification) continue;

      const coordinate = getVenueCoordinate(result.venue_name);
      if (!coordinate) {
        skipped.push(`${result.venue_name}（座標未登録）`);
        continue;
      }

      if (!ignoreDistance) {
        const distance = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          coordinate.latitude,
          coordinate.longitude
        );
        if (distance > searchRadiusKm) {
          skipped.push(`${result.venue_name}（${distance.toFixed(1)}km）`);
          continue;
        }
      }

      if (!bypassCooldown && this.lastNotifiedVenues.has(result.venue_name)) {
        skipped.push(`${result.venue_name}（クールダウン中）`);
        continue;
      }

      await this.sendNotification('需要ブースト接近', result.notification, {
        demandLevel: result.priority === DemandPriority.URGENT ? 'high' : 'medium',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        category: result.is_rokuyou_boost_day && result.is_wedding_enabled
          ? 'rokuyou_boost'
          : 'venue_boost',
      });
      sent.push(result.venue_name);
      this.lastNotifiedVenues.add(result.venue_name);
      setTimeout(() => {
        this.lastNotifiedVenues.delete(result.venue_name);
      }, this.notificationCooldownMs);
    }

    return { boostTargets, sent, skipped };
  }

  /**
   * Request permissions for local notifications
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Station demand + Module A venue boost notifications
   */
  async checkAllNotifications(
    userLocation: UserLocation | null,
    stations: Station[],
    demands: StationDemand[],
    searchRadiusKm: number = VENUE_NOTIFY_RADIUS_KM,
    currentTime: Date = new Date()
  ): Promise<void> {
    await this.checkAndNotify(userLocation, stations, demands, searchRadiusKm);
    await this.checkVenueBoostNotifications(userLocation, searchRadiusKm, currentTime);
    await this.checkShareholderMeetingNotifications(userLocation, searchRadiusKm, currentTime);
    await this.checkBusinessChainNotifications(userLocation, searchRadiusKm, currentTime);
  }

  /**
   * 株主総会（A-009）— 終了60分前〜終了時刻・当日開催分・設定半径内
   */
  async checkShareholderMeetingNotifications(
    userLocation: UserLocation | null,
    searchRadiusKm: number = VENUE_NOTIFY_RADIUS_KM,
    currentTime: Date = new Date()
  ): Promise<void> {
    if (!userLocation) return;

    await initShareholderMeetingSchedule();

    const settings = getNotificationSettings();
    if (!settings.shareholderMeetingNotificationsEnabled) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const monitored = this.shareholderEngine.monitorTodayMeetings(currentTime);

    for (const result of monitored) {
      if (!result.is_boost_target || result.priority !== DemandPriority.URGENT) continue;
      if (!result.notification) continue;

      const meeting = getShareholderMeetingSchedule().find((m) => m.id === result.meeting_id);
      const coordinate = meeting
        ? resolveShareholderMeetingCoordinate(meeting)
        : resolveShareholderMeetingCoordinate({ venueName: result.venue_name });
      if (!coordinate) continue;

      const distance = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        coordinate.latitude,
        coordinate.longitude
      );

      if (distance > searchRadiusKm) continue;

      const cooldownKey = `agm_${result.meeting_id}`;
      if (this.lastNotifiedVenues.has(cooldownKey)) continue;

      await this.sendNotification('株主総会ブースト接近', result.notification, {
        demandLevel: 'high',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        category: 'shareholder_meeting_boost',
      });

      this.lastNotifiedVenues.add(cooldownKey);
      setTimeout(() => {
        this.lastNotifiedVenues.delete(cooldownKey);
      }, this.notificationCooldownMs);
    }
  }

  /**
   * ビジネスチェーン（CO 10:00）— 9:30〜10:00・設定半径内のみ
   */
  async checkBusinessChainNotifications(
    userLocation: UserLocation | null,
    searchRadiusKm: number = VENUE_NOTIFY_RADIUS_KM,
    currentTime: Date = new Date()
  ): Promise<void> {
    if (!userLocation) return;

    const settings = getNotificationSettings();
    if (!settings.businessChainNotificationsEnabled) return;
    if (!isInBusinessChainNotifyWindow(currentTime)) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    void discoverBusinessChainsNear(
      userLocation.latitude,
      userLocation.longitude,
      searchRadiusKm
    ).catch((error) => {
      console.warn('Business chain discovery skipped:', error);
    });

    const nearby = await findNearbyBusinessChainLocations(
      userLocation.latitude,
      userLocation.longitude,
      searchRadiusKm
    );

    for (const loc of nearby) {
      if (this.lastNotifiedVenues.has(loc.id)) continue;

      const body = formatBusinessChainNotificationBody(loc.name, loc.distanceKm);

      await this.sendNotification('需要ブースト接近', body, {
        demandLevel: 'high',
        latitude: loc.latitude,
        longitude: loc.longitude,
        category: 'business_chain_boost',
      });

      this.lastNotifiedVenues.add(loc.id);
      setTimeout(() => {
        this.lastNotifiedVenues.delete(loc.id);
      }, this.notificationCooldownMs);
    }
  }

  /**
   * Module A: hotel / wedding venue boost notifications (GPS filtered)
   */
  async checkVenueBoostNotifications(
    userLocation: UserLocation | null,
    searchRadiusKm: number = VENUE_NOTIFY_RADIUS_KM,
    currentTime: Date = new Date()
  ): Promise<void> {
    if (!userLocation) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    const monitored = this.venueEngine.monitorAllVenues(currentTime);

    for (const result of monitored) {
      if (!result.is_boost_target || result.priority !== DemandPriority.URGENT) continue;
      if (!result.notification) continue;

      const coordinate = getVenueCoordinate(result.venue_name);
      if (!coordinate) continue;

      const distance = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        coordinate.latitude,
        coordinate.longitude
      );

      if (distance > searchRadiusKm) continue;
      if (this.lastNotifiedVenues.has(result.venue_name)) continue;

      await this.sendNotification('需要ブースト接近', result.notification, {
        demandLevel: result.priority === DemandPriority.URGENT ? 'high' : 'medium',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        category: result.is_rokuyou_boost_day && result.is_wedding_enabled
          ? 'rokuyou_boost'
          : 'venue_boost',
      });

      this.lastNotifiedVenues.add(result.venue_name);
      setTimeout(() => {
        this.lastNotifiedVenues.delete(result.venue_name);
      }, this.notificationCooldownMs);
    }
  }

  /**
   * Checks demands and user location, and triggers notifications if conditions are met
   */
  async checkAndNotify(
    userLocation: UserLocation | null,
    stations: Station[],
    demands: StationDemand[],
    searchRadiusKm: number
  ): Promise<void> {
    if (!userLocation) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    for (const demand of demands) {
      if (demand.riskLevel !== 'high') continue;
      if (demand.predictedDemand < 80) continue;

      const station = stations.find((s) => s.id === demand.stationId);
      if (!station) continue;

      const distance = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        station.latitude,
        station.longitude
      );

      if (distance <= searchRadiusKm) {
        if (this.lastNotifiedStations.has(station.id)) {
          continue;
        }

        await this.sendNotification(
          '高需要エリア接近',
          `${station.name}付近でタクシー需要が高まっています（${distance.toFixed(1)}km圏内）`,
          {
            demandLevel: demand.riskLevel,
            predictedDemand: demand.predictedDemand,
            latitude: station.latitude,
            longitude: station.longitude,
          }
        );

        this.lastNotifiedStations.add(station.id);

        setTimeout(() => {
          this.lastNotifiedStations.delete(station.id);
        }, this.notificationCooldownMs);
      }
    }
  }

  private async sendNotification(
    title: string,
    body: string,
    meta?: {
      demandLevel?: 'low' | 'medium' | 'high';
      predictedDemand?: number;
      latitude?: number;
      longitude?: number;
      category?: NotificationCategory;
    }
  ): Promise<void> {
    recordNotification({
      title,
      body,
      category: meta?.category ?? inferNotificationCategory(title, body),
      demandLevel: meta?.demandLevel,
      predictedDemand: meta?.predictedDemand,
      latitude: meta?.latitude,
      longitude: meta?.longitude,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  }
}

export const notificationEngine = new NotificationEngine();
