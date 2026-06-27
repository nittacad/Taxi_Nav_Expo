import { getStationCoordinateByName } from '@/data/stationCoordinates';
import { getVenueCoordinate } from '@/data/venueCoordinates';
import { resolveShareholderMeetingCoordinate } from '@/utils/shareholderMeetingLocation';
import type { AppNotificationRecord } from '@/types/notificationList';
import type { MapFocusTarget } from '@/services/mapFocusStore';
import { parseNotificationForList } from '@/utils/notificationDisplay';
import { getShareholderMeetingSchedule } from '@/data/shareholderMeetingSchedule';

const DEFAULT_FOCUS_DELTA = 0.02;

function toMapFocusTarget(
  label: string,
  latitude: number,
  longitude: number
): MapFocusTarget {
  return {
    latitude,
    longitude,
    label,
    latitudeDelta: DEFAULT_FOCUS_DELTA,
    longitudeDelta: DEFAULT_FOCUS_DELTA,
  };
}

export function resolveNotificationLocation(
  record: AppNotificationRecord
): MapFocusTarget | null {
  const row = parseNotificationForList(record);
  const label = row.placeName;

  if (record.category === 'venue_boost' || record.category === 'rokuyou_boost') {
    const coordinate = getVenueCoordinate(label);
    if (coordinate) {
      return toMapFocusTarget(label, coordinate.latitude, coordinate.longitude);
    }
  }

  if (record.category === 'shareholder_meeting_boost') {
    const venueMatch = record.body.match(/（([^）]+)）/);
    const venueName = venueMatch?.[1] ?? label;
    const meeting = getShareholderMeetingSchedule().find(
      (m) => m.companyName === label || m.venueName === venueName
    );
    const coordinate = meeting
      ? resolveShareholderMeetingCoordinate(meeting)
      : resolveShareholderMeetingCoordinate({ venueName });
    if (coordinate) {
      return toMapFocusTarget(label, coordinate.latitude, coordinate.longitude);
    }
  }

  if (record.category === 'station_demand') {
    const coordinate = getStationCoordinateByName(label);
    if (coordinate) {
      return toMapFocusTarget(label, coordinate.latitude, coordinate.longitude);
    }
  }

  if (record.latitude != null && record.longitude != null) {
    return toMapFocusTarget(label, record.latitude, record.longitude);
  }

  return null;
}
