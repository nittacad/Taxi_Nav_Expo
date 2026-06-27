import { getBusinessChainById } from '@/data/businessChainRegistry';
import { getAllBusinessChainLocations } from '@/services/businessChainLocationStore';
import type { NearbyBusinessChainLocation } from '@/types/businessChain';
import { calculateDistanceKm } from '@/utils/geoDistance';
import { isLikelyBusinessChainHotel } from '@/utils/businessChainFilters';

export async function findNearbyBusinessChainLocations(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<NearbyBusinessChainLocation[]> {
  const all = await getAllBusinessChainLocations();

  const nearby: NearbyBusinessChainLocation[] = [];

  for (const loc of all) {
    if (!isLikelyBusinessChainHotel(loc.name)) continue;
    const distanceKm = calculateDistanceKm(latitude, longitude, loc.latitude, loc.longitude);
    if (distanceKm > radiusKm) continue;

    nearby.push({
      ...loc,
      distanceKm,
      chainDisplayName: getBusinessChainById(loc.chainId).displayName,
    });
  }

  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatBusinessChainNotificationBody(
  locationName: string,
  distanceKm: number
): string {
  return (
    `🔴 【需要ブースト】${locationName}\n` +
    `チェックアウト予定: 10:00\n` +
    `→ ビジネスチェーン需要圏内（${distanceKm.toFixed(1)}km）`
  );
}
