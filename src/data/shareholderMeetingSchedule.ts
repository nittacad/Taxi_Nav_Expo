/**
 * 株主総会開催スケジュール — 同梱 + リモート JSON
 */

import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';
import { getActiveShareholderMeetingSchedule } from '@/services/shareholderMeetingRemoteStore';

export function getShareholderMeetingSchedule(): readonly ScheduledShareholderMeeting[] {
  return getActiveShareholderMeetingSchedule();
}

export function getMeetingsOnDate(date: Date): ScheduledShareholderMeeting[] {
  const key = formatDateKey(date);
  return getShareholderMeetingSchedule().filter((m) => m.meetingDate === key);
}

export function getMeetingCount(): number {
  return getShareholderMeetingSchedule().length;
}

export function parseMeetingStartTime(meeting: ScheduledShareholderMeeting): Date {
  const [year, month, day] = meeting.meetingDate.split('-').map(Number);
  const [hour, minute] = meeting.startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
