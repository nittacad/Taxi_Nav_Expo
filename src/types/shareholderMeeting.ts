/**
 * A-009 logic_notification_shareholder_meeting.py TypeScript types
 */

import type { DemandPriority } from '@/types/venueNotification';

export interface ShareholderMeetingVenue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  prefecture: string;
  typicalMeetingDurationHours: number;
  expectedParticipantCount: number;
}

export interface ScheduledShareholderMeeting {
  id: string;
  companyName: string;
  venueName: string;
  /** YYYY-MM-DD（開催日） */
  meetingDate: string;
  /** HH:MM 開始時刻 */
  startTime: string;
  participantCount: number;
  /** 会場住所（EDINET DB 自動取得時） */
  venueAddress?: string;
  /** 東京都23区の区名 */
  ward?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShareholderMeetingMonitorResult {
  meeting_id: string;
  company_name: string;
  venue_name: string;
  start_time: Date;
  predicted_end_time: Date;
  participant_count: number;
  is_boost_target: boolean;
  priority: DemandPriority;
  priority_name: string;
  notification: string | null;
  minutes_until_end: number;
}
