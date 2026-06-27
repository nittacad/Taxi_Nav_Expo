/**
 * TypeScript port of logic_notification_engine.py v2.2 (Module A)
 * Python source is the canonical master; do not modify Module A from the app layer.
 */

import { MASTER_VENUE_LIST } from '@/data/masterVenueList';
import {
  DemandPriority,
  MasterVenue,
  VenueMonitorResult,
  VenuePolicy,
  DemandPriorityName,
} from '@/types/venueNotification';
import {
  getRokuyouBoost,
  getRokuyouName,
  isRokuyouBoostDay,
} from '@/utils/rokuyou';

function priorityName(priority: DemandPriority): DemandPriorityName {
  return DemandPriority[priority] as DemandPriorityName;
}

function parseCheckoutTime(checkoutTimeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = checkoutTimeStr.split(':');
  return { hour: Number(hourStr), minute: Number(minuteStr) };
}

function withTimeOnDate(targetDate: Date, hour: number, minute: number): Date {
  const result = new Date(targetDate);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function minutesUntil(triggerTime: Date, currentTime: Date): number {
  return (triggerTime.getTime() - currentTime.getTime()) / 60_000;
}

export class UnifiedNotificationEngine {
  readonly venues: readonly MasterVenue[];

  private readonly venueIndex: Readonly<Record<string, MasterVenue>>;

  private readonly venueTypeIndex: Readonly<Record<string, readonly MasterVenue[]>>;

  constructor(venues: readonly MasterVenue[] = MASTER_VENUE_LIST) {
    this.venues = venues;
    this.venueIndex = Object.fromEntries(venues.map((venue) => [venue.name, venue]));
    this.venueTypeIndex = venues.reduce<Record<string, MasterVenue[]>>((acc, venue) => {
      const list = acc[venue.type] ?? [];
      list.push(venue);
      acc[venue.type] = list;
      return acc;
    }, {});
  }

  /** @deprecated use getRokuyouBoost from @/utils/rokuyou */
  getRokuyouBoost(date: Date): number {
    return getRokuyouBoost(date);
  }

  calculateTriggerTime(
    venue: MasterVenue,
    targetDate: Date = new Date()
  ): Date {
    if (venue.policy === 'checkout_base') {
      const { hour, minute } = parseCheckoutTime(venue.checkout_time ?? '11:00');
      return withTimeOnDate(targetDate, hour, minute);
    }

    if (venue.policy === 'event_base') {
      return withTimeOnDate(targetDate, 21, 0);
    }

    return new Date(targetDate);
  }

  checkBoostNotificationTrigger(
    venue: MasterVenue,
    currentTime: Date,
    triggerTime: Date
  ): boolean {
    const until = minutesUntil(triggerTime, currentTime);
    const policy: VenuePolicy = venue.policy;

    if (policy === 'checkout_base') {
      return until > -0.5 && until <= 60;
    }

    if (policy === 'event_base') {
      return (until > -0.5 && until <= 30) || (until >= -0.5 && until <= 0);
    }

    return until > -0.5 && until <= 60;
  }

  calculateBoostNotificationPriority(
    venue: MasterVenue,
    currentTime: Date,
    triggerTime: Date
  ): DemandPriority {
    const isInBoostWindow = this.checkBoostNotificationTrigger(venue, currentTime, triggerTime);

    if (!isInBoostWindow) {
      return DemandPriority.MEDIUM;
    }

    // 専用式場（event_base）: 大安・友引のみ URGENT（六曜通知）
    if (venue.policy === 'event_base' && venue.is_wedding_enabled) {
      return isRokuyouBoostDay(triggerTime) ? DemandPriority.URGENT : DemandPriority.MEDIUM;
    }

    // ホテル等: ブースト窓内は URGENT（結婚式対応は文言で六曜強化）
    return DemandPriority.URGENT;
  }

  generateNotification(
    venue: MasterVenue,
    priority: DemandPriority,
    triggerTime: Date
  ): string | null {
    const triggerLabel =
      venue.policy === 'checkout_base' ? 'チェックアウト予定' : '披露宴終了予定';

    const rokuyouBoostDay = isRokuyouBoostDay(triggerTime);
    const rokuyouName = getRokuyouName(triggerTime);
    const showRokuyouEnhancement =
      venue.is_wedding_enabled && rokuyouBoostDay && priority === DemandPriority.URGENT;

    if (priority === DemandPriority.URGENT) {
      const headerTag = showRokuyouEnhancement ? `・${rokuyouName}` : '';
      let body =
        `🔴 【需要ブースト${headerTag}】${venue.name}\n` +
        `${triggerLabel}: ${formatTime(triggerTime)}\n`;

      if (showRokuyouEnhancement) {
        body += `六曜: ${rokuyouName}（結婚式需要強化日）\n`;
      }

      body += `→ 大量のタクシー需要が予想されます！`;
      return body;
    }

    if (priority === DemandPriority.HIGH) {
      return (
        `🟠 【高需要】${venue.name}\n` +
        `${triggerLabel}: ${formatTime(triggerTime)}\n` +
        `→ タクシー需要の増加が予想されます`
      );
    }

    return null;
  }

  monitorAllVenues(currentTime: Date = new Date()): VenueMonitorResult[] {
    return this.venues.map((venue) => {
      const triggerTime = this.calculateTriggerTime(venue, currentTime);
      const isBoostTarget = this.checkBoostNotificationTrigger(venue, currentTime, triggerTime);
      const priority = this.calculateBoostNotificationPriority(venue, currentTime, triggerTime);
      const notification = this.generateNotification(venue, priority, triggerTime);
      const rokuyouBoostDay = isRokuyouBoostDay(triggerTime);

      return {
        venue_name: venue.name,
        venue_type: venue.type,
        policy: venue.policy,
        is_wedding_enabled: venue.is_wedding_enabled,
        trigger_time: triggerTime,
        is_boost_target: isBoostTarget,
        priority,
        priority_name: priorityName(priority),
        notification,
        minutes_until_trigger: minutesUntil(triggerTime, currentTime),
        is_rokuyou_boost_day: rokuyouBoostDay,
        rokuyou_name: rokuyouBoostDay ? getRokuyouName(triggerTime) : null,
      };
    });
  }

  getVenuesByType(venueType: MasterVenue['type']): readonly MasterVenue[] {
    return this.venueTypeIndex[venueType] ?? [];
  }

  getVenueById(venueName: string): MasterVenue | undefined {
    return this.venueIndex[venueName];
  }
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export const unifiedNotificationEngine = new UnifiedNotificationEngine();
