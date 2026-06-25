import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

class LocationService {
  private updateIntervalMs = 60000; // 1分更新
  private locationSubscription: Location.LocationSubscription | null = null;
  private isForegroundServiceRunning = false;

  /**
   * 位置情報の権限を要求する
   * @returns 権限が許可された場合は true、それ以外は false
   */
  async requestPermissionsAsync(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission denied.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * 現在の位置情報を1回取得する
   * @returns 位置情報データ、取得失敗時はnull
   */
  async getCurrentLocationAsync(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * 位置情報の定期的な監視を開始する
   * @param onUpdate 位置情報が更新されたときに呼ばれるコールバック
   * @param intervalMs 更新間隔（ミリ秒）。デフォルトは60000(1分)
   */
  async startLocationUpdatesAsync(
    onUpdate: (location: LocationData) => void,
    intervalMs: number = this.updateIntervalMs
  ): Promise<boolean> {
    try {
      if (this.locationSubscription) {
        console.warn('Location updates are already running.');
        return true;
      }

      const hasPermission = await this.requestPermissionsAsync();
      if (!hasPermission) return false;

      this.isForegroundServiceRunning = true;
      
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: intervalMs,
          distanceInterval: 10, // 10メートル移動したら更新
        },
        (location) => {
          onUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      console.log(`Started location updates every ${intervalMs}ms`);
      return true;
    } catch (error) {
      console.error('Error starting location updates:', error);
      this.isForegroundServiceRunning = false;
      return false;
    }
  }

  /**
   * 位置情報の監視を停止する
   */
  stopLocationUpdates(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isForegroundServiceRunning = false;
    console.log('Stopped location updates');
  }

  /**
   * サービスが実行中かどうかを返す
   */
  isServiceRunning(): boolean {
    return this.isForegroundServiceRunning;
  }
}

// シングルトンインスタンスとしてエクスポート
export const locationService = new LocationService();
