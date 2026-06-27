import { getVenueCoordinate } from '@/data/venueCoordinates';
import type { MapFocusTarget } from '@/services/mapFocusStore';

const DEFAULT_FOCUS_DELTA = 0.02;

export function buildVenueMapFocus(venueName: string): MapFocusTarget | null {
  const coordinate = getVenueCoordinate(venueName);
  if (!coordinate) {
    return null;
  }

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    label: venueName,
    latitudeDelta: DEFAULT_FOCUS_DELTA,
    longitudeDelta: DEFAULT_FOCUS_DELTA,
  };
}
