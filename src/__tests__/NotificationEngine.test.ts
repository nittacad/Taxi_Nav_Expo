import { NotificationEngine } from '../services/NotificationEngine';
import { UnifiedNotificationEngine } from '../services/UnifiedNotificationEngine';
import * as Notifications from 'expo-notifications';
import { UserLocation, Station, StationDemand } from '@/types';
import { DemandPriority } from '@/types/venueNotification';
import type { MasterVenue } from '@/types/venueNotification';
import { updateNotificationSettings, resetNotificationSettingsForTests } from '@/services/notificationSettingsStore';
import { resetNotificationHistoryForTests } from '@/services/notificationHistory';

jest.mock('expo-notifications');
jest.mock('@/services/businessChainDiscoveryService', () => ({
  discoverBusinessChainsNear: jest.fn().mockResolvedValue({ queried: false, addedCount: 0, cellKey: '0_0' }),
}));

describe('NotificationEngine', () => {
  let engine: NotificationEngine;

  beforeEach(() => {
    engine = new NotificationEngine();
    resetNotificationSettingsForTests();
    resetNotificationHistoryForTests();
    jest.clearAllMocks();
  });

  it('should request permissions', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await engine.requestPermissions();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('should not notify if no permission', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const userLocation: UserLocation = { latitude: 35.681, longitude: 139.767, accuracy: 10, timestamp: 123 };
    const stations: Station[] = [{ id: 1, name: 'Tokyo', latitude: 35.681, longitude: 139.767, region: 'Kanto' }];
    const demands: StationDemand[] = [
      { stationId: 1, stationName: 'Tokyo', predictedDemand: 90, riskLevel: 'high', confidence: 0.9, timestamp: 123, trend: 'up' }
    ];

    await engine.checkAndNotify(userLocation, stations, demands, 5);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('should notify if within radius and high demand', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const userLocation: UserLocation = { latitude: 35.681, longitude: 139.767, accuracy: 10, timestamp: 123 };
    const stations: Station[] = [{ id: 1, name: 'Tokyo', latitude: 35.682, longitude: 139.768, region: 'Kanto' }];
    const demands: StationDemand[] = [
      { stationId: 1, stationName: 'Tokyo', predictedDemand: 90, riskLevel: 'high', confidence: 0.9, timestamp: 123, trend: 'up' }
    ];

    await engine.checkAndNotify(userLocation, stations, demands, 5);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '高需要エリア接近',
        }),
      })
    );
  });

  it('should notify venue boost when inside checkout window and near hotel', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const hotel: MasterVenue = {
      name: '帝国ホテル',
      type: 'hotel',
      policy: 'checkout_base',
      checkout_time: '12:00',
      is_wedding_enabled: true,
    };
    const mockVenueEngine = {
      monitorAllVenues: jest.fn().mockReturnValue([
        {
          venue_name: '帝国ホテル',
          is_boost_target: true,
          priority: DemandPriority.URGENT,
          notification: '🔴 【需要ブースト】帝国ホテル',
        },
      ]),
    } as unknown as UnifiedNotificationEngine;

    const venueEngine = new NotificationEngine(mockVenueEngine);
    const userLocation: UserLocation = { latitude: 35.6720, longitude: 139.7588, accuracy: 10, timestamp: 123 };
    const checkoutDay = new Date(2026, 5, 25, 11, 30);

    await venueEngine.checkVenueBoostNotifications(userLocation, 5, checkoutDay);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '需要ブースト接近',
        }),
      })
    );
    expect(hotel.name).toBe('帝国ホテル');
  });

  it('notifies business chain during 9:30-10:00 window within radius', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    updateNotificationSettings({ businessChainNotificationsEnabled: true, searchRadiusKm: 3 });

    const userLocation: UserLocation = {
      latitude: 35.705616,
      longitude: 139.794489,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const at930 = new Date(2026, 5, 25, 9, 45);

    await engine.checkBusinessChainNotifications(userLocation, 3, at930);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '需要ブースト接近',
          body: expect.stringContaining('チェックアウト予定: 10:00'),
        }),
      })
    );
  });

  it('skips business chain notifications outside 9:30-10:00', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    updateNotificationSettings({ businessChainNotificationsEnabled: true });

    await engine.checkBusinessChainNotifications(
      { latitude: 35.705616, longitude: 139.794489, accuracy: 10, timestamp: 0 },
      3,
      new Date(2026, 5, 25, 11, 0)
    );

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('notifies shareholder meeting in boost window within radius', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    updateNotificationSettings({ shareholderMeetingNotificationsEnabled: true });

    await engine.checkShareholderMeetingNotifications(
      { latitude: 35.6766, longitude: 139.7648, accuracy: 10, timestamp: 0 },
      5,
      new Date(2026, 5, 25, 12, 0)
    );

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: '株主総会ブースト接近',
          body: expect.stringContaining('株主総会終了予定'),
        }),
      })
    );
  });

  it('notifies wedding venue on taian only', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const userLocation: UserLocation = {
      latitude: 35.679,
      longitude: 139.764,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const taian = new Date(2026, 5, 20, 20, 45);
    const other = new Date(2026, 5, 21, 20, 45);

    await engine.checkVenueBoostNotifications(userLocation, 5, taian);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: expect.stringContaining('大安'),
        }),
      })
    );

    jest.clearAllMocks();
    engine.clearVenueNotificationCooldown();

    await engine.checkVenueBoostNotifications(userLocation, 5, other);
    const kaikanCalls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.filter(
      (call) => String(call[0]?.content?.body ?? '').includes('東京會舘')
    );
    expect(kaikanCalls).toHaveLength(0);
  });

  it('runVenueBoostTest dryRun lists boost targets without sending', async () => {
    const result = await engine.runVenueBoostTest({
      latitude: 35.672,
      longitude: 139.7588,
      at: new Date(2026, 5, 25, 11, 30),
      dryRun: true,
    });

    expect(result.boostTargets.length).toBeGreaterThan(0);
    expect(result.sent).toHaveLength(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('runVenueBoostTest sends notifications when ignoreDistance is true', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await engine.runVenueBoostTest({
      latitude: 35.672,
      longitude: 139.7588,
      at: new Date(2026, 5, 25, 11, 30),
      ignoreDistance: true,
      bypassCooldown: true,
    });

    expect(result.sent.length).toBeGreaterThan(0);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
});
