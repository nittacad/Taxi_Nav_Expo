/**
 * MASTER_VENUE_LIST — synced with logic_notification_engine.py v2.2 (Module A)
 * Hotel rows: checkout/check-in from hotelRegistry.ts (official sources).
 * Do not edit Python Module A; update hotelRegistry when hotel facts change.
 */

import { HOTEL_REGISTRY } from '@/data/hotelRegistry';
import type { MasterVenue } from '@/types/venueNotification';

const HOTEL_VENUES: readonly MasterVenue[] = HOTEL_REGISTRY.map((hotel) => ({
  name: hotel.name,
  type: 'hotel' as const,
  policy: 'checkout_base' as const,
  check_in_time: hotel.checkInTime,
  checkout_time: hotel.checkOutTime,
  is_wedding_enabled: hotel.isWeddingEnabled,
  hotel_tier: hotel.tier,
}));

const EVENT_VENUES: readonly MasterVenue[] = [
  { name: '東京會舘', type: 'venue', policy: 'event_base', is_wedding_enabled: true },
  { name: '八芳園', type: 'venue', policy: 'event_base', is_wedding_enabled: true },
  { name: '明治記念会館', type: 'venue', policy: 'event_base', is_wedding_enabled: true },
];

export const MASTER_VENUE_LIST: readonly MasterVenue[] = [...HOTEL_VENUES, ...EVENT_VENUES] as const;

export const VENUE_NOTIFY_RADIUS_KM = 5;
