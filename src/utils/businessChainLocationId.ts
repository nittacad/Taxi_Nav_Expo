import type { BusinessChainId, BusinessChainLocation } from '@/types/businessChain';
import { matchBusinessChainId } from '@/data/businessChainRegistry';

export function buildBusinessChainLocationId(
  chainId: BusinessChainId,
  latitude: number,
  longitude: number
): string {
  return `${chainId}_${latitude.toFixed(5)}_${longitude.toFixed(5)}`.replace(/\./g, 'd');
}

export function createBusinessChainLocation(input: {
  chainId: BusinessChainId;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  source: BusinessChainLocation['source'];
  discoveredAt?: string;
}): BusinessChainLocation {
  return {
    id: buildBusinessChainLocationId(input.chainId, input.latitude, input.longitude),
    chainId: input.chainId,
    name: input.name.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    source: input.source,
    discoveredAt: input.discoveredAt,
  };
}

export function parseChainFromOsmName(name: string): BusinessChainId | null {
  return matchBusinessChainId(name);
}
