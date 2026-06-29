/**
 * FareWaveformClient.ts
 * 駅別運賃波形 API クライアント
 * 東京・上野: JSON（同梱 + リモート） / 品川: モック
 */

import {
  getStationFareWaveform,
  isFareWaveformStationSupported,
} from '@/data/fareWaveformRegistry';
import { initFareWaveformTokyoSchedule } from '@/services/fareWaveformTokyoRemoteStore';
import { initFareWaveformUenoSchedule } from '@/services/fareWaveformUenoRemoteStore';
import { ApiError } from '@/types';
import {
  FARE_WAVEFORM_TOKYO_STATION_ID,
  FARE_WAVEFORM_UENO_STATION_ID,
  StationFareWaveformData,
  DEFAULT_TIME_PRESET,
  TimePreset,
} from '@/types/fareWaveform';

const MOCK_LATENCY_MS = 120;

const JSON_STATION_IDS = new Set<number>([
  FARE_WAVEFORM_TOKYO_STATION_ID,
  FARE_WAVEFORM_UENO_STATION_ID,
]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureJsonStationSchedule(stationId: number): Promise<void> {
  if (stationId === FARE_WAVEFORM_TOKYO_STATION_ID) {
    await initFareWaveformTokyoSchedule();
    return;
  }
  if (stationId === FARE_WAVEFORM_UENO_STATION_ID) {
    await initFareWaveformUenoSchedule();
  }
}

export class FareWaveformClient {
  /**
   * 指定駅・曜日・時間帯の運賃波形データを取得する。
   * 東京・上野は JSON、品川はモック。
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

    if (JSON_STATION_IDS.has(stationId)) {
      await ensureJsonStationSchedule(stationId);
    } else {
      await delay(MOCK_LATENCY_MS);
    }

    return getStationFareWaveform(stationId, dayCategory, timePreset);
  }
}

export { isFareWaveformStationSupported };

export const fareWaveformClient = new FareWaveformClient();
