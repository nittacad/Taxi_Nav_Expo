/**
 * stationCoordinates.ts
 * 駅・施設 ID → 緯度経度（オートルート並び替え用）
 */

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

/** MapScreen / モックデータと整合する座標 */
export const STATION_COORDINATES: Record<number, GeoCoordinate> = {
  1: { latitude: 35.681236, longitude: 139.767125 },
  2: { latitude: 35.690921, longitude: 139.700258 },
  3: { latitude: 35.628471, longitude: 139.73876 },
  4: { latitude: 35.658034, longitude: 139.701636 },
  5: { latitude: 35.729503, longitude: 139.7109 },
  6: { latitude: 35.713768, longitude: 139.777254 },
  7: { latitude: 35.666379, longitude: 139.758331 },
  8: { latitude: 35.698353, longitude: 139.773114 },
  9: { latitude: 35.655381, longitude: 139.757129 },
  10: { latitude: 35.728157, longitude: 139.770641 },
  101: { latitude: 35.675, longitude: 139.7709 },
  102: { latitude: 35.6751, longitude: 139.7289 },
  103: { latitude: 35.6923, longitude: 139.6905 },
  104: { latitude: 35.6601, longitude: 139.7015 },
  105: { latitude: 35.6842, longitude: 139.7671 },
  106: { latitude: 35.677, longitude: 139.765 },
};

export function getStationCoordinate(stationId: number): GeoCoordinate | undefined {
  return STATION_COORDINATES[stationId];
}

/** 駅名 → 座標（通知一覧の地図表示用） */
export const STATION_NAME_COORDINATES: Readonly<Record<string, GeoCoordinate>> = {
  東京駅: STATION_COORDINATES[1]!,
  新宿駅: STATION_COORDINATES[2]!,
  品川駅: STATION_COORDINATES[3]!,
  渋谷駅: STATION_COORDINATES[4]!,
  池袋駅: STATION_COORDINATES[5]!,
  上野駅: STATION_COORDINATES[6]!,
  新橋駅: STATION_COORDINATES[7]!,
  秋葉原駅: STATION_COORDINATES[8]!,
  浜松町駅: STATION_COORDINATES[9]!,
  日暮里駅: STATION_COORDINATES[10]!,
};

export function getStationCoordinateByName(stationName: string): GeoCoordinate | undefined {
  return STATION_NAME_COORDINATES[stationName];
}
