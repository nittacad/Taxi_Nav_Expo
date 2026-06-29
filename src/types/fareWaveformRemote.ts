/**
 * 駅別運賃波形 — リモート / 同梱 JSON ペイロード
 */

import type { StationFareWaveformData } from '@/types/fareWaveform';

export const FARE_WAVEFORM_STATION_JSON_VERSION = 1;

/** @deprecated FARE_WAVEFORM_STATION_JSON_VERSION を使用 */
export const FARE_WAVEFORM_TOKYO_JSON_VERSION = FARE_WAVEFORM_STATION_JSON_VERSION;

export const FARE_WAVEFORM_REMOTE_REFRESH_MS = 24 * 60 * 60 * 1000;

export type FareWaveformStationDataset = Record<string, StationFareWaveformData>;

/** @deprecated FareWaveformStationDataset を使用 */
export type FareWaveformTokyoDataset = FareWaveformStationDataset;

export interface FareWaveformStationRemotePayload {
  version: number;
  generatedAt: string;
  stationId: number;
  stationName: string;
  supportedStationIds: number[];
  source: string;
  dataset: FareWaveformStationDataset;
}

/** @deprecated FareWaveformStationRemotePayload を使用 */
export type FareWaveformTokyoRemotePayload = FareWaveformStationRemotePayload;

export const FARE_WAVEFORM_TOKYO_STATION_ID = 1;

export const FARE_WAVEFORM_UENO_STATION_ID = 6;

export function makeFareWaveformDatasetKey(
  stationId: number,
  dayCategory: string,
  timePreset: string,
): string {
  return `${stationId}:${dayCategory}:${timePreset}`;
}
