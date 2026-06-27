import { HOTEL_REGISTRY, getHotelRegistryEntry, getHotelsByTier } from '@/data/hotelRegistry';
import { MASTER_VENUE_LIST } from '@/data/masterVenueList';

describe('hotelRegistry', () => {
  it('contains exactly 29 hotels', () => {
    expect(HOTEL_REGISTRY.length).toBe(29);
  });

  it('covers 29 hotels: luxury 19 + standard 10', () => {
    expect(HOTEL_REGISTRY.length).toBe(29);
    expect(getHotelsByTier('luxury').length).toBe(19);
    expect(getHotelsByTier('standard').length).toBe(10);
  });

  it('syncs checkout times to master venue list for all hotels', () => {
    for (const hotel of HOTEL_REGISTRY) {
      const master = MASTER_VENUE_LIST.find((v) => v.name === hotel.name);
      expect(master?.checkout_time).toBe(hotel.checkOutTime);
      expect(master?.check_in_time).toBe(hotel.checkInTime);
      expect(master?.hotel_tier).toBe(hotel.tier);
    }
  });

  it('documents tier vs official checkout exceptions', () => {
    const asakusa = getHotelRegistryEntry('浅草ビューホテル');
    const toranomon = getHotelRegistryEntry('ホテル虎ノ門ヒルズ');
    expect(asakusa?.tier).toBe('standard');
    expect(asakusa?.checkOutTime).toBe('12:00');
    expect(toranomon?.tier).toBe('standard');
    expect(toranomon?.checkOutTime).toBe('12:00');
  });

  it('uses Oshiage address for Richmond Score (not Ryogoku)', () => {
    const richmond = getHotelRegistryEntry('リッチモンドホテルプレミア東京スコーレ');
    expect(richmond?.address).toContain('押上1-10-3');
    expect(richmond?.checkOutTime).toBe('11:00');
  });

  it('uses Kabukicho address for Bellustar', () => {
    const bellustar = getHotelRegistryEntry('ベルスター東京');
    expect(bellustar?.address).toContain('歌舞伎町1-29-1');
  });

  it('uses Meguro address for Westin', () => {
    const westin = getHotelRegistryEntry('ウェスティンホテル東京');
    expect(westin?.address).toContain('目黒区三田1-4-1');
  });
});
