import { locationService } from '../services/LocationService';
import * as Location from 'expo-location';

// expo-location をモック化
jest.mock('expo-location', () => {
  return {
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    watchPositionAsync: jest.fn(),
    Accuracy: {
      Balanced: 3,
    },
  };
});

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 各テスト前にサービスの状態をリセット
    locationService.stopLocationUpdates();
  });

  describe('requestPermissionsAsync', () => {
    it('should return true when permission is granted', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await locationService.requestPermissionsAsync();
      expect(result).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('should return false when permission is denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await locationService.requestPermissionsAsync();
      expect(result).toBe(false);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentLocationAsync', () => {
    it('should return location data when permission is granted and location is fetched', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
        coords: {
          latitude: 35.681236,
          longitude: 139.767125,
        },
      });

      const result = await locationService.getCurrentLocationAsync();
      expect(result).toEqual({
        latitude: 35.681236,
        longitude: 139.767125,
      });
    });

    it('should return null when permission is denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const result = await locationService.getCurrentLocationAsync();
      expect(result).toBeNull();
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  describe('startLocationUpdatesAsync', () => {
    it('should start watching position and call onUpdate', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      // watchPositionAsync はコールバックを引数に取るので、モック内で即座に呼び出すように設定
      const mockSubscription = { remove: jest.fn() };
      (Location.watchPositionAsync as jest.Mock).mockImplementation((options, callback) => {
        // 同期的に1回コールバックを叩いてみる
        callback({
          coords: { latitude: 35.0, longitude: 139.0 }
        });
        return Promise.resolve(mockSubscription);
      });

      const onUpdateMock = jest.fn();
      const result = await locationService.startLocationUpdatesAsync(onUpdateMock, 1000);

      expect(result).toBe(true);
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        expect.objectContaining({ timeInterval: 1000 }),
        expect.any(Function)
      );
      expect(onUpdateMock).toHaveBeenCalledWith({ latitude: 35.0, longitude: 139.0 });
      expect(locationService.isServiceRunning()).toBe(true);
    });

    it('should not start if already running', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValue({ remove: jest.fn() });

      await locationService.startLocationUpdatesAsync(jest.fn());
      const result2 = await locationService.startLocationUpdatesAsync(jest.fn());

      // 2回目は早期リターンされるはず
      expect(result2).toBe(true);
      expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1); 
    });
  });

  describe('stopLocationUpdates', () => {
    it('should remove subscription and set running state to false', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      const mockSubscription = { remove: jest.fn() };
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(mockSubscription);

      await locationService.startLocationUpdatesAsync(jest.fn());
      expect(locationService.isServiceRunning()).toBe(true);

      locationService.stopLocationUpdates();

      expect(mockSubscription.remove).toHaveBeenCalledTimes(1);
      expect(locationService.isServiceRunning()).toBe(false);
    });
  });
});
