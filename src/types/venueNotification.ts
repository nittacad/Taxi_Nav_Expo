/**
 * Module A (logic_notification_engine.py v2.2) TypeScript types
 */

export type VenueType = 'hotel' | 'venue';

export type VenuePolicy = 'checkout_base' | 'event_base';

/** Taxi demand taxonomy: luxury (typical CO 12:00) vs standard (typical CO 11:00) */
export type HotelTier = 'luxury' | 'standard';

export interface LateCheckoutPolicy {
  /** Whether late checkout is offered (paid / member / plan) */
  available: boolean;
  /** Latest documented extension time (HH:MM), or null if inquiry-only */
  latestTime: string | null;
  feeNote: string;
}

export interface HotelRegistryEntry {
  name: string;
  tier: HotelTier;
  postalCode: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  lateCheckout: LateCheckoutPolicy;
  isWeddingEnabled: boolean;
  officialUrl?: string;
  /** ISO date when facts were last verified against official sources */
  verifiedAt: string;
  notes?: string;
}

export interface MasterVenue {
  name: string;
  type: VenueType;
  policy: VenuePolicy;
  checkout_time?: string;
  check_in_time?: string;
  is_wedding_enabled: boolean;
  hotel_tier?: HotelTier;
}

export interface VenueCoordinate {
  latitude: number;
  longitude: number;
}

export enum DemandPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export interface VenueMonitorResult {
  venue_name: string;
  venue_type: VenueType;
  policy: VenuePolicy;
  is_wedding_enabled: boolean;
  trigger_time: Date;
  is_boost_target: boolean;
  priority: DemandPriority;
  priority_name: DemandPriorityName;
  notification: string | null;
  minutes_until_trigger: number;
  /** 大安・友引（結婚式需要強化日） */
  is_rokuyou_boost_day: boolean;
  rokuyou_name: string | null;
}

export type DemandPriorityName = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
