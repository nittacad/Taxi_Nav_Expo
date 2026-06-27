import { BUSINESS_CHAIN_SEED_LOCATIONS } from '@/data/businessChainSeedLocations';
import { isInServiceArea } from '@/data/businessChainCoverage';
import type { BusinessChainLocation } from '@/types/businessChain';
import { createBusinessChainLocation } from '@/utils/businessChainLocationId';
import { isLikelyBusinessChainHotel } from '@/utils/businessChainFilters';

const STORAGE_KEY = 'business_chain_discovered_v1';

type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

let memoryStorage: Record<string, string> = {};

const defaultStorage: StorageAdapter = {
  async getItem(key: string) {
    return memoryStorage[key] ?? null;
  },
  async setItem(key: string, value: string) {
    memoryStorage[key] = value;
  },
};

let storageAdapter: StorageAdapter = defaultStorage;

export function setBusinessChainStorageAdapter(adapter: StorageAdapter): void {
  storageAdapter = adapter;
}

export function resetBusinessChainStorageForTests(): void {
  memoryStorage = {};
  discoveredCache = null;
  mergeCache = null;
}

let discoveredCache: BusinessChainLocation[] | null = null;
let mergeCache: BusinessChainLocation[] | null = null;

async function loadDiscovered(): Promise<BusinessChainLocation[]> {
  if (discoveredCache) return discoveredCache;
  try {
    const raw = await storageAdapter.getItem(STORAGE_KEY);
    if (!raw) {
      discoveredCache = [];
      return discoveredCache;
    }
    const parsed = JSON.parse(raw) as BusinessChainLocation[];
    discoveredCache = Array.isArray(parsed) ? parsed : [];
    return discoveredCache;
  } catch {
    discoveredCache = [];
    return discoveredCache;
  }
}

async function saveDiscovered(locations: BusinessChainLocation[]): Promise<void> {
  discoveredCache = locations;
  mergeCache = null;
  await storageAdapter.setItem(STORAGE_KEY, JSON.stringify(locations));
}

function dedupe(locations: readonly BusinessChainLocation[]): BusinessChainLocation[] {
  const map = new Map<string, BusinessChainLocation>();
  for (const loc of locations) {
    map.set(loc.id, loc);
  }
  return [...map.values()];
}

export async function getAllBusinessChainLocations(): Promise<readonly BusinessChainLocation[]> {
  if (mergeCache) return mergeCache;
  const discovered = await loadDiscovered();
  mergeCache = dedupe([...BUSINESS_CHAIN_SEED_LOCATIONS, ...discovered]);
  return mergeCache;
}

export async function addDiscoveredBusinessChainLocations(
  incoming: readonly BusinessChainLocation[]
): Promise<number> {
  const existing = await loadDiscovered();
  const existingIds = new Set(existing.map((l) => l.id));
  const seedIds = new Set(BUSINESS_CHAIN_SEED_LOCATIONS.map((l) => l.id));

  const toAdd = incoming.filter(
    (loc) =>
      isLikelyBusinessChainHotel(loc.name) &&
      isInServiceArea(loc.latitude, loc.longitude) &&
      !existingIds.has(loc.id) &&
      !seedIds.has(loc.id)
  );

  if (toAdd.length === 0) return 0;

  const merged = dedupe([...existing, ...toAdd]);
  await saveDiscovered(merged);
  return toAdd.length;
}

export async function upsertDiscoveredFromOsmHit(hit: {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  chainId: BusinessChainLocation['chainId'];
}): Promise<boolean> {
  if (!isInServiceArea(hit.latitude, hit.longitude)) return false;

  const loc = createBusinessChainLocation({
    chainId: hit.chainId,
    name: hit.name,
    latitude: hit.latitude,
    longitude: hit.longitude,
    address: hit.address,
    source: 'discovered',
    discoveredAt: new Date().toISOString(),
  });

  const added = await addDiscoveredBusinessChainLocations([loc]);
  return added > 0;
}

export async function getDiscoveredCount(): Promise<number> {
  const discovered = await loadDiscovered();
  return discovered.length;
}
