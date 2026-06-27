/**
 * 株主総会会場の座標解決 — スケジュール座標 → 会場マスターの順
 */

import { getShareholderMeetingVenue } from '@/data/shareholderMeetingVenueRegistry';
import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';

export function resolveShareholderMeetingCoordinate(
  meeting: Pick<ScheduledShareholderMeeting, 'venueName' | 'latitude' | 'longitude'>
): { latitude: number; longitude: number } | undefined {
  if (
    meeting.latitude != null &&
    meeting.longitude != null &&
    Number.isFinite(meeting.latitude) &&
    Number.isFinite(meeting.longitude)
  ) {
    return { latitude: meeting.latitude, longitude: meeting.longitude };
  }

  const venue = getShareholderMeetingVenue(meeting.venueName);
  if (!venue) return undefined;
  return { latitude: venue.latitude, longitude: venue.longitude };
}
