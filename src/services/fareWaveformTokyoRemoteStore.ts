/**
 * 東京駅運賃波形 — リモート JSON 取得 + 端末内キャッシュ
 * URL 未設定時は同梱データ（generated.ts）のみ使用
 */

import Constants from 'expo-constants';

import { FARE_WAVEFORM_TOKYO_IMPORTED } from '@/data/fareWaveformTokyo.generated';
import {
  FARE_WAVEFORM_REMOTE_REFRESH_MS,
  FARE_WAVEFORM_TOKYO_JSON_VERSION,
  FARE_WAVEFORM_TOKYO_STATION_ID,
  makeFareWaveformDatasetKey,
  type FareWaveformTokyoDataset,
  type FareWaveformTokyoRemotePayload,
} from '@/types/fareWaveformRemote';
import {
  resolveDayCategory,
  resolveTimePreset,
  type StationFareWaveformData,
  type TimePreset,
} from '@/types/fareWaveform';
import {
  fetchRemoteJson,
  shouldSkipRemoteRefresh,
} from '@/utils/remoteJsonSchedule';

let activeDataset: FareWaveformTokyoDataset = { ...FARE_WAVEFORM_TOKYO_IMPORTED.dataset };
let lastRemoteFetchAt: number | null = null;
let lastRemoteSource: 'bundled' | 'remote' | 'cache' = 'bundled';
let lastRemoteError: string | null = null;
let initPromise: Promise<void> | null = null;

export interface FareWaveformTokyoSyncStatus {
  source: 'bundled' | 'remote' | 'cache';
  entryCount: number;
  lastFetchAt: string | null;
  remoteUrl: string | null;
  lastError: string | null;
}

function getRemoteJsonUrl(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.fareWaveformTokyoJsonUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  return null;
}

function isValidWaveformEntry(raw: unknown): raw is StationFareWaveformData {
  if (!raw || typeof raw !== 'object') return false;
  const entry = raw as Record<string, unknown>;
  return (
    entry.stationId === FARE_WAVEFORM_TOKYO_STATION_ID &&
    typeof entry.stationName === 'string' &&
    typeof entry.dayCategory === 'string' &&
    typeof entry.timePreset === 'string' &&
    Array.isArray(entry.exits) &&
    entry.exits.length > 0 &&
    Array.isArray(entry.timeLabels) &&
    entry.timeLabels.length > 0
  );
}

function normalizeDataset(raw: unknown): FareWaveformTokyoDataset | null {
  if (!raw || typeof raw !== 'object') return null;
  const dataset = raw as Record<string, unknown>;
  const normalized: FareWaveformTokyoDataset = {};

  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith(`${FARE_WAVEFORM_TOKYO_STATION_ID}:`)) continue;
    if (!isValidWaveformEntry(value)) continue;
    normalized[key] = value;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function parseFareWaveformTokyoRemotePayload(
  data: unknown,
): FareWaveformTokyoDataset | null {
  if (!data || typeof data !== 'object') return null;
  const payload = data as FareWaveformTokyoRemotePayload;
  if (payload.version !== FARE_WAVEFORM_TOKYO_JSON_VERSION) return null;
  if (payload.stationId !== FARE_WAVEFORM_TOKYO_STATION_ID) return null;
  if (!Array.isArray(payload.supportedStationIds)) return null;
  if (!payload.supportedStationIds.includes(FARE_WAVEFORM_TOKYO_STATION_ID)) return null;
  return normalizeDataset(payload.dataset);
}

export function getTokyoFareWaveformFromStore(
  dayCategory: string,
  timePreset: TimePreset,
): StationFareWaveformData | null {
  const day = resolveDayCategory(dayCategory);
  const preset = resolveTimePreset(timePreset);
  const key = makeFareWaveformDatasetKey(FARE_WAVEFORM_TOKYO_STATION_ID, day, preset);
  return activeDataset[key] ?? null;
}

export function getFareWaveformTokyoSyncStatus(): FareWaveformTokyoSyncStatus {
  return {
    source: lastRemoteSource,
    entryCount: Object.keys(activeDataset).length,
    lastFetchAt: lastRemoteFetchAt ? new Date(lastRemoteFetchAt).toISOString() : null,
    remoteUrl: getRemoteJsonUrl(),
    lastError: lastRemoteError,
  };
}

export function resetFareWaveformTokyoStoreForTests(
  dataset: FareWaveformTokyoDataset = { ...FARE_WAVEFORM_TOKYO_IMPORTED.dataset },
): void {
  activeDataset = { ...dataset };
  lastRemoteFetchAt = null;
  lastRemoteSource = 'bundled';
  lastRemoteError = null;
  initPromise = null;
}

export async function refreshFareWaveformTokyoSchedule(
  options: { force?: boolean } = {},
): Promise<FareWaveformTokyoSyncStatus> {
  const url = getRemoteJsonUrl();
  if (!url) {
    lastRemoteSource = 'bundled';
    lastRemoteError = null;
    return getFareWaveformTokyoSyncStatus();
  }

  if (
    shouldSkipRemoteRefresh(
      lastRemoteFetchAt,
      options.force ?? false,
      FARE_WAVEFORM_REMOTE_REFRESH_MS,
    )
  ) {
    return getFareWaveformTokyoSyncStatus();
  }

  try {
    const json = await fetchRemoteJson(url);
    const remote = parseFareWaveformTokyoRemotePayload(json);
    lastRemoteFetchAt = Date.now();
    if (remote && Object.keys(remote).length > 0) {
      activeDataset = remote;
      lastRemoteSource = 'remote';
      lastRemoteError = null;
    } else {
      lastRemoteSource = Object.keys(activeDataset).length > 0 ? 'cache' : 'bundled';
      lastRemoteError = 'リモート JSON が空または形式不正';
    }
  } catch (error) {
    lastRemoteFetchAt = Date.now();
    lastRemoteError = error instanceof Error ? error.message : 'fetch failed';
    lastRemoteSource = Object.keys(activeDataset).length > 0 ? 'cache' : 'bundled';
  }

  return getFareWaveformTokyoSyncStatus();
}

export function initFareWaveformTokyoSchedule(): Promise<void> {
  if (!initPromise) {
    initPromise = refreshFareWaveformTokyoSchedule().then(() => undefined);
  }
  return initPromise;
}
