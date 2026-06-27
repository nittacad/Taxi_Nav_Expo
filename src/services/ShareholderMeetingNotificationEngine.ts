/**
 * TypeScript port of logic_notification_shareholder_meeting.py (A-009)
 */

import { getShareholderMeetingVenue } from '@/data/shareholderMeetingVenueRegistry';
import {
  getMeetingsOnDate,
  getShareholderMeetingSchedule,
  parseMeetingStartTime,
} from '@/data/shareholderMeetingSchedule';
import { DemandPriority } from '@/types/venueNotification';
import type {
  ScheduledShareholderMeeting,
  ShareholderMeetingMonitorResult,
  ShareholderMeetingVenue,
} from '@/types/shareholderMeeting';

const BOOST_TIME_BEFORE_MEETING_END_MINUTES = 60;
const DEFAULT_MEETING_DURATION_HOURS = 3.0;

function priorityName(priority: DemandPriority): string {
  return DemandPriority[priority];
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function minutesUntil(endTime: Date, currentTime: Date): number {
  return (endTime.getTime() - currentTime.getTime()) / 60_000;
}

export class ShareholderMeetingNotificationEngine {
  calculateMeetingEndTime(startTime: Date, venueName: string): Date {
    const venue = getShareholderMeetingVenue(venueName);
    const durationHours = venue?.typicalMeetingDurationHours ?? DEFAULT_MEETING_DURATION_HOURS;
    return new Date(startTime.getTime() + durationHours * 3_600_000);
  }

  checkBoostNotificationTrigger(currentTime: Date, meetingEndTime: Date): boolean {
    const until = minutesUntil(meetingEndTime, currentTime);
    return until > -0.5 && until <= BOOST_TIME_BEFORE_MEETING_END_MINUTES;
  }

  calculateBoostNotificationPriority(
    meetingEndTime: Date,
    currentTime: Date,
    participantCount: number
  ): DemandPriority {
    let basePriority = DemandPriority.MEDIUM;
    if (participantCount >= 3000) {
      basePriority = DemandPriority.HIGH;
    }

    if (this.checkBoostNotificationTrigger(currentTime, meetingEndTime)) {
      return DemandPriority.URGENT;
    }

    return basePriority;
  }

  generateShareholderMeetingNotification(
    companyName: string,
    venueName: string,
    meetingEndTime: Date,
    finalPriority: DemandPriority,
    participantCount: number
  ): string | null {
    const label = `${companyName}（${venueName}）`;

    if (finalPriority === DemandPriority.URGENT) {
      return (
        `🔴 【大需要ブースト】${label}\n` +
        `株主総会終了予定: ${formatTime(meetingEndTime)}\n` +
        `参加者数: 約${participantCount.toLocaleString('ja-JP')}名\n` +
        `→ 大量タクシー需要が予想されます！`
      );
    }

    if (finalPriority === DemandPriority.HIGH) {
      return (
        `🟠 【高需要】${label}\n` +
        `株主総会終了予定: ${formatTime(meetingEndTime)}\n` +
        `参加者数: 約${participantCount.toLocaleString('ja-JP')}名\n` +
        `→ タクシー需要の増加が予想されます`
      );
    }

    return null;
  }

  monitorMeeting(
    meeting: ScheduledShareholderMeeting,
    currentTime: Date = new Date()
  ): ShareholderMeetingMonitorResult {
    const startTime = parseMeetingStartTime(meeting);
    const meetingEndTime = this.calculateMeetingEndTime(startTime, meeting.venueName);
    const isBoostTarget = this.checkBoostNotificationTrigger(currentTime, meetingEndTime);
    const priority = this.calculateBoostNotificationPriority(
      meetingEndTime,
      currentTime,
      meeting.participantCount
    );
    const notification = this.generateShareholderMeetingNotification(
      meeting.companyName,
      meeting.venueName,
      meetingEndTime,
      priority,
      meeting.participantCount
    );

    return {
      meeting_id: meeting.id,
      company_name: meeting.companyName,
      venue_name: meeting.venueName,
      start_time: startTime,
      predicted_end_time: meetingEndTime,
      participant_count: meeting.participantCount,
      is_boost_target: isBoostTarget,
      priority,
      priority_name: priorityName(priority),
      notification,
      minutes_until_end: minutesUntil(meetingEndTime, currentTime),
    };
  }

  monitorTodayMeetings(currentTime: Date = new Date()): ShareholderMeetingMonitorResult[] {
    return getMeetingsOnDate(currentTime).map((meeting) => this.monitorMeeting(meeting, currentTime));
  }

  getActiveVenues(): readonly ShareholderMeetingVenue[] {
    const names = new Set(getShareholderMeetingSchedule().map((m) => m.venueName));
    return [...names]
      .map((name) => getShareholderMeetingVenue(name))
      .filter((v): v is ShareholderMeetingVenue => v != null);
  }
}

export const shareholderMeetingNotificationEngine = new ShareholderMeetingNotificationEngine();
