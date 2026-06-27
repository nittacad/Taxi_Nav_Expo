import { MASTER_VENUE_LIST } from '@/data/masterVenueList';
import { UnifiedNotificationEngine } from '@/services/UnifiedNotificationEngine';
import { DemandPriority } from '@/types/venueNotification';
import type { MasterVenue } from '@/types/venueNotification';

describe('UnifiedNotificationEngine', () => {
  const engine = new UnifiedNotificationEngine();

  it('loads 32 venues from master list', () => {
    expect(engine.venues.length).toBe(32);
    expect(engine.getVenuesByType('hotel').length).toBe(29);
    expect(engine.getVenuesByType('venue').length).toBe(3);
    expect(MASTER_VENUE_LIST.length).toBe(32);
  });

  it('returns rokuyou boost for taian and tomobiki', () => {
    expect(engine.getRokuyouBoost(new Date(2026, 5, 20))).toBe(1.5);
    expect(engine.getRokuyouBoost(new Date(2026, 5, 21))).toBe(1.0);
  });

  it('calculates hotel checkout trigger time', () => {
    const hotel = engine.getVenueById('帝国ホテル');
    expect(hotel).toBeDefined();
    const trigger = engine.calculateTriggerTime(hotel as MasterVenue, new Date(2026, 5, 25));
    expect(trigger.getHours()).toBe(12);
    expect(trigger.getMinutes()).toBe(0);
  });

  it('calculates wedding venue trigger at 21:00', () => {
    const venue = engine.getVenueById('東京會舘');
    expect(venue).toBeDefined();
    const trigger = engine.calculateTriggerTime(venue as MasterVenue, new Date(2026, 5, 25));
    expect(trigger.getHours()).toBe(21);
    expect(trigger.getMinutes()).toBe(0);
  });

  it('marks hotel boost window 60 minutes before checkout', () => {
    const hotel = engine.getVenueById('帝国ホテル') as MasterVenue;
    const trigger = engine.calculateTriggerTime(hotel, new Date(2026, 5, 25, 12, 0));
    const inside = new Date(2026, 5, 25, 11, 30);
    const outside = new Date(2026, 5, 25, 10, 30);

    expect(engine.checkBoostNotificationTrigger(hotel, inside, trigger)).toBe(true);
    expect(engine.checkBoostNotificationTrigger(hotel, outside, trigger)).toBe(false);
  });

  it('elevates priority to URGENT inside boost window', () => {
    const hotel = engine.getVenueById('帝国ホテル') as MasterVenue;
    const trigger = engine.calculateTriggerTime(hotel, new Date(2026, 5, 25, 12, 0));
    const current = new Date(2026, 5, 25, 11, 45);

    const priority = engine.calculateBoostNotificationPriority(hotel, current, trigger);
    expect(priority).toBe(DemandPriority.URGENT);
    expect(engine.generateNotification(hotel, priority, trigger)).toContain('帝国ホテル');
  });

  it('notifies wedding venue only on taian or tomobiki', () => {
    const venue = engine.getVenueById('東京會舘') as MasterVenue;
    const taianCurrent = new Date(2026, 5, 20, 20, 45);
    const taianTrigger = engine.calculateTriggerTime(venue, taianCurrent);
    const otherCurrent = new Date(2026, 5, 21, 20, 45);
    const otherTrigger = engine.calculateTriggerTime(venue, otherCurrent);

    expect(engine.calculateBoostNotificationPriority(venue, taianCurrent, taianTrigger)).toBe(
      DemandPriority.URGENT
    );
    expect(engine.calculateBoostNotificationPriority(venue, otherCurrent, otherTrigger)).toBe(
      DemandPriority.MEDIUM
    );
  });

  it('adds rokuyou enhancement for wedding-enabled hotel on taian', () => {
    const hotel = engine.getVenueById('帝国ホテル') as MasterVenue;
    const current = new Date(2026, 5, 20, 11, 45);
    const trigger = engine.calculateTriggerTime(hotel, current);
    const priority = engine.calculateBoostNotificationPriority(hotel, current, trigger);
    const message = engine.generateNotification(hotel, priority, trigger);

    expect(priority).toBe(DemandPriority.URGENT);
    expect(message).toContain('大安');
    expect(message).toContain('六曜: 大安');
  });

  it('monitorAllVenues flags rokuyou boost day on taian', () => {
    const testTime = new Date(2026, 5, 20, 20, 45);
    const results = engine.monitorAllVenues(testTime);
    const kaikan = results.find((r) => r.venue_name === '東京會舘');
    expect(kaikan?.is_rokuyou_boost_day).toBe(true);
    expect(kaikan?.priority).toBe(DemandPriority.URGENT);
    expect(kaikan?.notification).toContain('大安');
  });

  it('monitorAllVenues skips wedding venue notification on non-taian day', () => {
    const testTime = new Date(2026, 5, 21, 20, 45);
    const results = engine.monitorAllVenues(testTime);
    const kaikan = results.find((r) => r.venue_name === '東京會舘');
    expect(kaikan?.is_rokuyou_boost_day).toBe(false);
    expect(kaikan?.priority).toBe(DemandPriority.MEDIUM);
    expect(kaikan?.notification).toBeNull();
  });

  it('monitorAllVenues returns one result per venue', () => {
    const testTime = new Date(2026, 5, 25, 11, 30);
    const results = engine.monitorAllVenues(testTime);
    expect(results.length).toBe(32);
    expect(results.every((r) => typeof r.is_boost_target === 'boolean')).toBe(true);
  });
});
