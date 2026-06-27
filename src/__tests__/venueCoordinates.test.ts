import { MASTER_VENUE_LIST } from '@/data/masterVenueList';
import { getVenueCoordinate, VENUE_COORDINATES } from '@/data/venueCoordinates';

describe('venueCoordinates', () => {
  it('covers every master venue with valid coordinates', () => {
    for (const venue of MASTER_VENUE_LIST) {
      const coordinate = getVenueCoordinate(venue.name);
      expect(coordinate).toBeDefined();
      expect(coordinate?.latitude).toBeGreaterThan(35.5);
      expect(coordinate?.latitude).toBeLessThan(35.8);
      expect(coordinate?.longitude).toBeGreaterThan(139.5);
      expect(coordinate?.longitude).toBeLessThan(139.9);
    }
  });

  it('does not cluster unrelated luxury hotels at the old wrong pin (139.729)', () => {
    const parkHyatt = VENUE_COORDINATES['パークハイアット東京'];
    const westin = VENUE_COORDINATES['ウェスティンホテル東京'];
    const conrad = VENUE_COORDINATES['コンラッド東京'];

    expect(parkHyatt.longitude).toBeLessThan(139.70);
    expect(westin.latitude).toBeLessThan(35.65);
    expect(conrad.longitude).toBeGreaterThan(139.75);
  });

  it('places Westin Tokyo in Meguro (Mita), not Yoyogi cluster', () => {
    const westin = VENUE_COORDINATES['ウェスティンホテル東京'];
    expect(westin.latitude).toBeCloseTo(35.6415, 2);
    expect(westin.longitude).toBeCloseTo(139.7154, 2);
  });

  it('places Richmond Score in Oshiage, not Ryogoku Kokugikan', () => {
    const richmond = VENUE_COORDINATES['リッチモンドホテルプレミア東京スコーレ'];
    expect(richmond.latitude).toBeGreaterThan(35.71);
    expect(richmond.longitude).toBeGreaterThan(139.81);
  });

  it('places Bellustar in Kabukicho Shinjuku', () => {
    const bellustar = VENUE_COORDINATES['ベルスター東京'];
    expect(bellustar.latitude).toBeCloseTo(35.696, 2);
    expect(bellustar.longitude).toBeCloseTo(139.701, 2);
  });
});
