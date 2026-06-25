import { useLocalSearchParams } from 'expo-router';

import { StationFareWaveformScreen } from '@/screens/StationFareWaveformScreen';

export default function StationFareWaveformRoute() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>();

  if (!stationId) {
    return null;
  }

  return <StationFareWaveformScreen />;
}
