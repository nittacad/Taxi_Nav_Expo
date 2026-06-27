/**
 * 株主総会会場マスター — logic_notification_shareholder_meeting.py (A-009) 準拠
 */

import type { ShareholderMeetingVenue } from '@/types/shareholderMeeting';

export const SHAREHOLDER_MEETING_VENUES: readonly ShareholderMeetingVenue[] = [
  {
    id: 'tokyo_international_forum',
    name: '東京国際フォーラム',
    latitude: 35.6766,
    longitude: 139.7648,
    prefecture: '東京都',
    typicalMeetingDurationHours: 3.0,
    expectedParticipantCount: 5000,
  },
  {
    id: 'hotel_new_otani',
    name: 'ホテルニューオータニ',
    latitude: 35.6809,
    longitude: 139.7340,
    prefecture: '東京都',
    typicalMeetingDurationHours: 3.5,
    expectedParticipantCount: 3000,
  },
  {
    id: 'tokyo_dome',
    name: '東京ドーム',
    latitude: 35.7049,
    longitude: 139.7561,
    prefecture: '東京都',
    typicalMeetingDurationHours: 4.0,
    expectedParticipantCount: 10000,
  },
  {
    id: 'hilton_tokyo',
    name: 'ヒルトン東京',
    latitude: 35.6719,
    longitude: 139.7285,
    prefecture: '東京都',
    typicalMeetingDurationHours: 3.0,
    expectedParticipantCount: 2000,
  },
  {
    id: 'mitsui_garden_shibuya',
    name: '三井ガーデンホテル渋谷',
    latitude: 35.6623,
    longitude: 139.7027,
    prefecture: '東京都',
    typicalMeetingDurationHours: 2.5,
    expectedParticipantCount: 1500,
  },
] as const;

const venueByName = new Map(SHAREHOLDER_MEETING_VENUES.map((v) => [v.name, v]));

export function getShareholderMeetingVenue(name: string): ShareholderMeetingVenue | undefined {
  return venueByName.get(name);
}

export function getShareholderMeetingCoordinate(
  venueName: string
): { latitude: number; longitude: number } | undefined {
  const venue = getShareholderMeetingVenue(venueName);
  if (!venue) return undefined;
  return { latitude: venue.latitude, longitude: venue.longitude };
}
