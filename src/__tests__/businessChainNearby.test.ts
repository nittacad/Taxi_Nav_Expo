import {
  addDiscoveredBusinessChainLocations,
  getAllBusinessChainLocations,
  resetBusinessChainStorageForTests,
} from '@/services/businessChainLocationStore';
import { findNearbyBusinessChainLocations } from '@/services/businessChainNearbyService';

describe('businessChainLocationStore & nearby', () => {
  beforeEach(() => {
    resetBusinessChainStorageForTests();
  });

  it('merges seed and discovered locations', async () => {
    await addDiscoveredBusinessChainLocations([
      {
        id: 'apa_35d70000_139d82000',
        chainId: 'apa',
        name: 'APAホテル テスト',
        latitude: 35.7,
        longitude: 139.82,
        source: 'discovered',
      },
    ]);

    const all = await getAllBusinessChainLocations();
    expect(all.length).toBeGreaterThan(9);
    expect(all.some((l) => l.name === 'APAホテル テスト')).toBe(true);
  });

  it('finds nearby chain within radius', async () => {
    const nearby = await findNearbyBusinessChainLocations(35.705616, 139.794489, 1);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].distanceKm).toBeLessThanOrEqual(1);
  });
});
