/**
 * 秋葉原駅運賃波形 — リモート JSON 取得 + 端末内キャッシュ
 */

import { FARE_WAVEFORM_AKIHABARA_IMPORTED } from '@/data/fareWaveformAkihabara.generated';
import { createFareWaveformStationRemoteStore } from '@/services/createFareWaveformStationRemoteStore';
import {
  FARE_WAVEFORM_AKIHABARA_STATION_ID,
  type FareWaveformStationDataset,
} from '@/types/fareWaveformRemote';

const akihabaraStore = createFareWaveformStationRemoteStore({
  stationId: FARE_WAVEFORM_AKIHABARA_STATION_ID,
  remoteUrlExtraKey: 'fareWaveformAkihabaraJsonUrl',
  imported: FARE_WAVEFORM_AKIHABARA_IMPORTED,
});

export type FareWaveformAkihabaraSyncStatus = ReturnType<typeof akihabaraStore.getSyncStatus>;

export const getAkihabaraFareWaveformFromStore = akihabaraStore.getFareWaveformFromStore;
export const getFareWaveformAkihabaraSyncStatus = akihabaraStore.getSyncStatus;
export const resetFareWaveformAkihabaraStoreForTests = akihabaraStore.resetForTests;
export const refreshFareWaveformAkihabaraSchedule = akihabaraStore.refreshSchedule;
export const initFareWaveformAkihabaraSchedule = akihabaraStore.initSchedule;
export const parseFareWaveformAkihabaraRemotePayload = akihabaraStore.parseRemotePayload;

export type { FareWaveformStationDataset as FareWaveformAkihabaraDataset };
