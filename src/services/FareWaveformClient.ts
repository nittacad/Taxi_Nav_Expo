/**
 * FareWaveformClient.ts
 * 駅別運賃波形 API クライアント（現状モックのみ）
 */

import {
  getTokyoStationFareWaveform,
  isFareWaveformStationSupported,
} from '@/data/tokyoStationFareMock';
import { ApiError } from '@/types';
import { StationFareWaveformData, TimePreset } from '@/types/fareWaveform';

const MOCK_LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class FareWaveformClient {
  /**
   * 指定駅・曜日・時間帯の運賃波形データを取得する。
   * 現状は東京駅（id=1）のみ対応。
   */
  async fetchStationFareWaveform(
    stationId: number,
    dayCategory: string,
    timePreset: TimePreset = 'peak',
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
    return getTokyoStationFareWaveform(dayCategory, timePreset);
  }
}

export const fareWaveformClient = new FareWaveformClient();
