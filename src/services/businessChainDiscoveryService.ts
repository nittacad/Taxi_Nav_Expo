import { BUSINESS_CHAIN_REGISTRY } from '@/data/businessChainRegistry';
import { isInServiceArea } from '@/data/businessChainCoverage';
import { upsertDiscoveredFromOsmHit } from '@/services/businessChainLocationStore';
import { matchBusinessChainId } from '@/data/businessChainRegistry';
import { parseChainFromOsmName } from '@/utils/businessChainLocationId';

const DISCOVERY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const GRID_SCALE = 100;

const queriedCells = new Map<string, number>();

function cellKey(latitude: number, longitude: number): string {
  return `${Math.floor(latitude * GRID_SCALE)}_${Math.floor(longitude * GRID_SCALE)}`;
}

function shouldQueryCell(latitude: number, longitude: number, now: number): boolean {
  const key = cellKey(latitude, longitude);
  const last = queriedCells.get(key);
  if (last == null) return true;
  return now - last >= DISCOVERY_COOLDOWN_MS;
}

function markCellQueried(latitude: number, longitude: number, now: number): void {
  queriedCells.set(cellKey(latitude, longitude), now);
}

/** @internal テスト用 */
export function resetDiscoveryCellsForTests(): void {
  queriedCells.clear();
}

function kmToDegree(km: number): number {
  return km / 111;
}

async function nominatimSearchInBox(
  query: string,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): Promise<Array<{ name: string; lat: number; lon: number; display_name?: string }>> {
  const params = new URLSearchParams({
    q: `${query} 東京都`,
    format: 'json',
    limit: '30',
    countrycodes: 'jp',
    viewbox: `${minLng},${maxLat},${maxLng},${minLat}`,
    bounded: '1',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'TaxiNavExpo/1.0 (business-chain-discovery)' },
  });

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    name?: string;
    display_name?: string;
  }>;

  return data
    .map((hit) => ({
      name: hit.name ?? hit.display_name?.split(',')[0] ?? query,
      lat: Number.parseFloat(hit.lat),
      lon: Number.parseFloat(hit.lon),
      display_name: hit.display_name,
    }))
    .filter((hit) => Number.isFinite(hit.lat) && Number.isFinite(hit.lon));
}

export interface DiscoveryResult {
  queried: boolean;
  addedCount: number;
  cellKey: string;
}

/**
 * 現在地周辺のグリッドセルで OSM 検索し、ヒットしたチェーン店舗を蓄積する。
 * 同一セルは24時間に1回まで。
 */
export async function discoverBusinessChainsNear(
  latitude: number,
  longitude: number,
  radiusKm: number,
  now: number = Date.now()
): Promise<DiscoveryResult> {
  const key = cellKey(latitude, longitude);

  if (!isInServiceArea(latitude, longitude)) {
    return { queried: false, addedCount: 0, cellKey: key };
  }

  if (!shouldQueryCell(latitude, longitude, now)) {
    return { queried: false, addedCount: 0, cellKey: key };
  }

  markCellQueried(latitude, longitude, now);

  const offset = kmToDegree(Math.max(radiusKm, 2));
  const minLat = latitude - offset;
  const maxLat = latitude + offset;
  const minLng = longitude - offset;
  const maxLng = longitude + offset;

  let addedCount = 0;

  for (const chain of BUSINESS_CHAIN_REGISTRY) {
    const primaryQuery = chain.matchPatterns[0];
    try {
      const hits = await nominatimSearchInBox(primaryQuery, minLat, maxLat, minLng, maxLng);
      for (const hit of hits) {
        const chainId = parseChainFromOsmName(hit.name) ?? matchBusinessChainId(hit.display_name ?? '');
        if (chainId !== chain.id) continue;

        const added = await upsertDiscoveredFromOsmHit({
          chainId,
          name: hit.name,
          latitude: hit.lat,
          longitude: hit.lon,
          address: hit.display_name,
        });
        if (added) addedCount += 1;
      }
      await new Promise((r) => setTimeout(r, 1100));
    } catch (error) {
      console.warn(`Business chain discovery failed for ${chain.displayName}:`, error);
    }
  }

  return { queried: true, addedCount, cellKey: key };
}
