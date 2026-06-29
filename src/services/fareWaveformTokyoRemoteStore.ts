/**
 * 東京駅運賃波形 — リモート JSON 取得 + 端末内キャッシュ
 */

import { FARE_WAVEFORM_TOKYO_IMPORTED } from '@/data/fareWaveformTokyo.generated';
import { createFareWaveformStationRemoteStore } from '@/services/createFareWaveformStationRemoteStore';
import {
  FARE_WAVEFORM_TOKYO_STATION_ID,
  type FareWaveformStationDataset,
} from '@/types/fareWaveformRemote';

const tokyoStore = createFareWaveformStationRemoteStore({
  stationId: FARE_WAVEFORM_TOKYO_STATION_ID,
  remoteUrlExtraKey: 'fareWaveformTokyoJsonUrl',
  imported: FARE_WAVEFORM_TOKYO_IMPORTED,
});

export type FareWaveformTokyoSyncStatus = ReturnType<typeof tokyoStore.getSyncStatus>;

export const getTokyoFareWaveformFromStore = tokyoStore.getFareWaveformFromStore;
export const getFareWaveformTokyoSyncStatus = tokyoStore.getSyncStatus;
export const resetFareWaveformTokyoStoreForTests = tokyoStore.resetForTests;
export const refreshFareWaveformTokyoSchedule = tokyoStore.refreshSchedule;
export const initFareWaveformTokyoSchedule = tokyoStore.initSchedule;
export const parseFareWaveformTokyoRemotePayload = tokyoStore.parseRemotePayload;

export type { FareWaveformStationDataset as FareWaveformTokyoDataset };
