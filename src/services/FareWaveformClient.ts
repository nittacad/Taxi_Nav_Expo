/**
 * FareWaveformClient.ts
 * 駅別運賃波形 API クライアント（現状モックのみ）
 */

import {
  getStationFareWaveform,
  isFareWaveformStationSupported,
} from '@/data/fareWaveformRegistry';
import { ApiError } from '@/types';
import { StationFareWaveformData, DEFAULT_TIME_PRESET, TimePreset } from '@/types/fareWaveform';

const MOCK_LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class FareWaveformClient {
  /**
   * 指定駅・曜日・時間帯の運賃波形データを取得する。
   * 現状は東京・品川・上野（モック）のみ対応。
   */
  async fetchStationFareWaveform(
    stationId: number,
    dayCategory: string,
    timePreset: TimePreset = DEFAULT_TIME_PRESET,
  ): Promise<StationFareWaveformData> {
    if (!isFareWaveformStationSupported(stationId)) {
      throw new ApiError(
        `駅 ID ${stationId} は運賃波形データに未対応です`,
        'FARE_WAVEFORM_UNSUPPORTED',
        404,
        false,
      );
    }

    await delay(MOCK_LATENCY_MS);
    return getStationFareWaveform(stationId, dayCategory, timePreset);
  }
}

export { isFareWaveformStationSupported };

export const fareWaveformClient = new FareWaveformClient();
