/**
 * fareWaveformRegistry.ts
 * 駅別運賃波形モックのルーティング
 */

import { getTokyoStationFareWaveform } from '@/data/tokyoStationFareMock';
import { getShinagawaStationFareWaveform } from '@/data/shinagawaStationFareMock';
import { getUenoStationFareWaveform } from '@/data/uenoStationFareMock';
import { getTokyoFareWaveformFromStore } from '@/services/fareWaveformTokyoRemoteStore';
import {
  FARE_WAVEFORM_SUPPORTED_STATION_IDS,
  DEFAULT_TIME_PRESET,
  StationFareWaveformData,
  TimePreset,
} from '@/types/fareWaveform';

export function isFareWaveformStationSupported(stationId: number): boolean {
  return FARE_WAVEFORM_SUPPORTED_STATION_IDS.has(stationId);
}

export function getStationFareWaveform(
  stationId: number,
  dayCategory: string,
  timePreset: TimePreset = DEFAULT_TIME_PRESET,
): StationFareWaveformData {
  switch (stationId) {
    case 1: {
      const fromJson = getTokyoFareWaveformFromStore(dayCategory, timePreset);
      if (fromJson) {
        return fromJson;
      }
      return getTokyoStationFareWaveform(dayCategory, timePreset);
    }
    case 3:
      return getShinagawaStationFareWaveform(dayCategory, timePreset);
    case 6:
      return getUenoStationFareWaveform(dayCategory, timePreset);
    default:
      throw new Error(`Unsupported station fare waveform: ${stationId}`);
  }
}
