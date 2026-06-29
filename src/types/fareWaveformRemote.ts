/**
 * 東京駅運賃波形 — リモート / 同梱 JSON ペイロード
 */

import type { StationFareWaveformData } from '@/types/fareWaveform';

export const FARE_WAVEFORM_TOKYO_JSON_VERSION = 1;

export const FARE_WAVEFORM_TOKYO_STATION_ID = 1;

export const FARE_WAVEFORM_REMOTE_REFRESH_MS = 24 * 60 * 60 * 1000;

export type FareWaveformTokyoDataset = Record<string, StationFareWaveformData>;

export interface FareWaveformTokyoRemotePayload {
  version: number;
  generatedAt: string;
  stationId: number;
  stationName: string;
  supportedStationIds: number[];
  source: string;
  dataset: FareWaveformTokyoDataset;
}

export function makeFareWaveformDatasetKey(
  stationId: number,
  dayCategory: string,
  timePreset: string,
): string {
  return `${stationId}:${dayCategory}:${timePreset}`;
}
