import * as Notifications from 'expo-notifications';
import { UserLocation, StationDemand, Station } from '@/types';

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class NotificationEngine {
  private lastNotifiedStations: Set<number> = new Set();
  private notificationCooldownMs = 15 * 60 * 1000; // 15 minutes cooldown per station

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

    const now = Date.now();

    for (const demand of demands) {
      // Only notify for high demand
      if (demand.riskLevel !== 'high') continue;
      if (demand.predictedDemand < 80) continue; // High demand threshold

      const station = stations.find(s => s.id === demand.stationId);
      if (!station) continue;

      const distance = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        station.latitude,
        station.longitude
      );

      // Check if within radius
      if (distance <= searchRadiusKm) {
        // Check cooldown
        if (this.lastNotifiedStations.has(station.id)) {
          continue; // Already notified recently
        }

        // Trigger notification
        await this.sendNotification(
          '高需要エリア接近',
          `${station.name}付近でタクシー需要が高まっています（${distance.toFixed(1)}km圏内）`
        );

        this.lastNotifiedStations.add(station.id);
        
        // Remove from cooldown after elapsed time
        setTimeout(() => {
          this.lastNotifiedStations.delete(station.id);
        }, this.notificationCooldownMs);
      }
    }
  }

  /**
   * Sends a local notification
   */
  private async sendNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }
}

export const notificationEngine = new NotificationEngine();
