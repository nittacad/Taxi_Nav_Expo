/**
 * stationDemandSort.ts
 * 駅・施設需要リストの並び替え + 現在地起点オートルート
 */

import { STATION_COORDINATES, GeoCoordinate } from '@/data/stationCoordinates';
import { StationDemand } from '@/types';

export type StationSortKey =
  | 'default'
  | 'demand'
  | 'confidence'
  | 'autoRoute';

export const STATION_SORT_LABELS: Record<StationSortKey, string> = {
  default: '既定',
  demand: '需要',
  confidence: '信頼度',
  autoRoute: '近い順',
};

/** 都心部タクシーのおおよその平均速度（km/h） */
export const URBAN_TAXI_SPEED_KMH = 22;

const EARTH_RADIUS_KM = 6371;

export type AutoRouteLeg = {
  stationId: number;
  legDistanceKm: number;
  legMinutes: number;
  cumulativeMinutes: number;
};

export type AutoRoutePlan = {
  stations: StationDemand[];
  legs: AutoRouteLeg[];
};

export function haversineDistanceKm(
  a: GeoCoordinate,
  b: GeoCoordinate,
): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function estimateTravelMinutes(distanceKm: number): number {
  if (distanceKm <= 0) {
    return 0;
  }
  return Math.max(1, Math.round((distanceKm / URBAN_TAXI_SPEED_KMH) * 60));
}

export function formatTravelMinutes(minutes: number): string {
  if (minutes < 60) {
    return `約${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `約${hours}時間`;
  }
  return `約${hours}時間${remainder}分`;
}

/**
 * 現在地から最寄りを繰り返す貪欲法（自動ルート）
 */
export function buildAutoRouteFromLocation(
  stations: readonly StationDemand[],
  origin: GeoCoordinate,
  coordinates: Record<number, GeoCoordinate> = STATION_COORDINATES,
): AutoRoutePlan {
  if (stations.length === 0) {
    return { stations: [], legs: [] };
  }

  const byId = new Map(stations.map((station) => [station.stationId, station]));
  const remaining = new Set(stations.map((station) => station.stationId));
  const ordered: StationDemand[] = [];
  const legs: AutoRouteLeg[] = [];

  let currentCoord = origin;
  let cumulativeMinutes = 0;

  while (remaining.size > 0) {
    let nearestId: number | null = null;
    let nearestDistance = Infinity;

    for (const candidateId of remaining) {
      const candidateCoord = coordinates[candidateId];
      if (!candidateCoord) {
        continue;
      }
      const distance = haversineDistanceKm(currentCoord, candidateCoord);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = candidateId;
      }
    }

    if (nearestId === null) {
      appendRemainingByStationId(ordered, remaining, byId);
      break;
    }

    const legMinutes = estimateTravelMinutes(nearestDistance);
    cumulativeMinutes += legMinutes;

    ordered.push(byId.get(nearestId)!);
    legs.push({
      stationId: nearestId,
      legDistanceKm: nearestDistance,
      legMinutes,
      cumulativeMinutes,
    });

    remaining.delete(nearestId);
    const nextCoord = coordinates[nearestId];
    if (!nextCoord) {
      appendRemainingByStationId(ordered, remaining, byId);
      break;
    }
    currentCoord = nextCoord;
  }

  return { stations: ordered, legs };
}

function appendRemainingByStationId(
  ordered: StationDemand[],
  remaining: Set<number>,
  byId: Map<number, StationDemand>,
): void {
  [...remaining]
    .sort((a, b) => a - b)
    .forEach((id) => {
      const station = byId.get(id);
      if (station) {
        ordered.push(station);
      }
    });
  remaining.clear();
}

export function sortStationDemands(
  stations: readonly StationDemand[],
  sortKey: StationSortKey,
): StationDemand[] {
  const list = [...stations];

  if (sortKey === 'demand') {
    return list.sort((a, b) => {
      const diff = b.predictedDemand - a.predictedDemand;
      return diff !== 0 ? diff : a.stationId - b.stationId;
    });
  }

  if (sortKey === 'confidence') {
    return list.sort((a, b) => {
      const diff = b.confidence - a.confidence;
      return diff !== 0 ? diff : a.stationId - b.stationId;
    });
  }

  if (sortKey === 'autoRoute') {
    return list;
  }

  return list.sort((a, b) => a.stationId - b.stationId);
}

/** @deprecated buildAutoRouteFromLocation を使用 */
export function sortStationDemandsByAutoRoute(
  stations: readonly StationDemand[],
  originStationId: number,
  coordinates: Record<number, GeoCoordinate> = STATION_COORDINATES,
): StationDemand[] {
  const originCoord = coordinates[originStationId];
  if (!originCoord) {
    return sortStationDemands(stations, 'default');
  }
  return buildAutoRouteFromLocation(stations, originCoord, coordinates).stations;
}
