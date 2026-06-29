/**
 * 上野駅運賃波形 — リモート JSON 取得 + 端末内キャッシュ
 */

import { FARE_WAVEFORM_UENO_IMPORTED } from '@/data/fareWaveformUeno.generated';
import { createFareWaveformStationRemoteStore } from '@/services/createFareWaveformStationRemoteStore';
import {
  FARE_WAVEFORM_UENO_STATION_ID,
  type FareWaveformStationDataset,
} from '@/types/fareWaveformRemote';

const uenoStore = createFareWaveformStationRemoteStore({
  stationId: FARE_WAVEFORM_UENO_STATION_ID,
  remoteUrlExtraKey: 'fareWaveformUenoJsonUrl',
  imported: FARE_WAVEFORM_UENO_IMPORTED,
});

export type FareWaveformUenoSyncStatus = ReturnType<typeof uenoStore.getSyncStatus>;

export const getUenoFareWaveformFromStore = uenoStore.getFareWaveformFromStore;
export const getFareWaveformUenoSyncStatus = uenoStore.getSyncStatus;
export const resetFareWaveformUenoStoreForTests = uenoStore.resetForTests;
export const refreshFareWaveformUenoSchedule = uenoStore.refreshSchedule;
export const initFareWaveformUenoSchedule = uenoStore.initSchedule;
export const parseFareWaveformUenoRemotePayload = uenoStore.parseRemotePayload;

export type { FareWaveformStationDataset as FareWaveformUenoDataset };
