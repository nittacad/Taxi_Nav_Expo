/**
 * 駅別運賃波形リモートストア — 共通ファクトリ
 */

import Constants from 'expo-constants';

import {
  FARE_WAVEFORM_REMOTE_REFRESH_MS,
  FARE_WAVEFORM_STATION_JSON_VERSION,
  makeFareWaveformDatasetKey,
  type FareWaveformStationDataset,
  type FareWaveformStationRemotePayload,
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

export interface FareWaveformStationSyncStatus {
  source: 'bundled' | 'remote' | 'cache';
  entryCount: number;
  lastFetchAt: string | null;
  remoteUrl: string | null;
  lastError: string | null;
}

export interface FareWaveformStationRemoteStore {
  getFareWaveformFromStore: (
    dayCategory: string,
    timePreset: TimePreset,
  ) => StationFareWaveformData | null;
  getSyncStatus: () => FareWaveformStationSyncStatus;
  resetForTests: (dataset?: FareWaveformStationDataset) => void;
  refreshSchedule: (options?: { force?: boolean }) => Promise<FareWaveformStationSyncStatus>;
  initSchedule: () => Promise<void>;
  parseRemotePayload: (data: unknown) => FareWaveformStationDataset | null;
}

interface CreateFareWaveformStationRemoteStoreOptions {
  stationId: number;
  remoteUrlExtraKey: string;
  imported: FareWaveformStationRemotePayload;
}

export function createFareWaveformStationRemoteStore(
  options: CreateFareWaveformStationRemoteStoreOptions,
): FareWaveformStationRemoteStore {
  const { stationId, remoteUrlExtraKey, imported } = options;

  let activeDataset: FareWaveformStationDataset = { ...imported.dataset };
  let lastRemoteFetchAt: number | null = null;
  let lastRemoteSource: 'bundled' | 'remote' | 'cache' = 'bundled';
  let lastRemoteError: string | null = null;
  let initPromise: Promise<void> | null = null;

  function getRemoteJsonUrl(): string | null {
    const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
    const fromExtra = extra?.[remoteUrlExtraKey];
    if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
      return fromExtra.trim();
    }
    return null;
  }

  function isValidWaveformEntry(raw: unknown): raw is StationFareWaveformData {
    if (!raw || typeof raw !== 'object') return false;
    const entry = raw as Record<string, unknown>;
    return (
      entry.stationId === stationId &&
      typeof entry.stationName === 'string' &&
      typeof entry.dayCategory === 'string' &&
      typeof entry.timePreset === 'string' &&
      Array.isArray(entry.exits) &&
      entry.exits.length > 0 &&
      Array.isArray(entry.timeLabels) &&
      entry.timeLabels.length > 0
    );
  }

  function normalizeDataset(raw: unknown): FareWaveformStationDataset | null {
    if (!raw || typeof raw !== 'object') return null;
    const dataset = raw as Record<string, unknown>;
    const normalized: FareWaveformStationDataset = {};

    for (const [key, value] of Object.entries(dataset)) {
      if (!key.startsWith(`${stationId}:`)) continue;
      if (!isValidWaveformEntry(value)) continue;
      normalized[key] = value;
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  function parseRemotePayload(data: unknown): FareWaveformStationDataset | null {
    if (!data || typeof data !== 'object') return null;
    const payload = data as FareWaveformStationRemotePayload;
    if (payload.version !== FARE_WAVEFORM_STATION_JSON_VERSION) return null;
    if (payload.stationId !== stationId) return null;
    if (!Array.isArray(payload.supportedStationIds)) return null;
    if (!payload.supportedStationIds.includes(stationId)) return null;
    return normalizeDataset(payload.dataset);
  }

  function getFareWaveformFromStore(
    dayCategory: string,
    timePreset: TimePreset,
  ): StationFareWaveformData | null {
    const day = resolveDayCategory(dayCategory);
    const preset = resolveTimePreset(timePreset);
    const key = makeFareWaveformDatasetKey(stationId, day, preset);
    return activeDataset[key] ?? null;
  }

  function getSyncStatus(): FareWaveformStationSyncStatus {
    return {
      source: lastRemoteSource,
      entryCount: Object.keys(activeDataset).length,
      lastFetchAt: lastRemoteFetchAt ? new Date(lastRemoteFetchAt).toISOString() : null,
      remoteUrl: getRemoteJsonUrl(),
      lastError: lastRemoteError,
    };
  }

  function resetForTests(
    dataset: FareWaveformStationDataset = { ...imported.dataset },
  ): void {
    activeDataset = { ...dataset };
    lastRemoteFetchAt = null;
    lastRemoteSource = 'bundled';
    lastRemoteError = null;
    initPromise = null;
  }

  async function refreshSchedule(
    refreshOptions: { force?: boolean } = {},
  ): Promise<FareWaveformStationSyncStatus> {
    const url = getRemoteJsonUrl();
    if (!url) {
      lastRemoteSource = 'bundled';
      lastRemoteError = null;
      return getSyncStatus();
    }

    if (
      shouldSkipRemoteRefresh(
        lastRemoteFetchAt,
        refreshOptions.force ?? false,
        FARE_WAVEFORM_REMOTE_REFRESH_MS,
      )
    ) {
      return getSyncStatus();
    }

    try {
      const json = await fetchRemoteJson(url);
      const remote = parseRemotePayload(json);
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

    return getSyncStatus();
  }

  function initSchedule(): Promise<void> {
    if (!initPromise) {
      initPromise = refreshSchedule().then(() => undefined);
    }
    return initPromise;
  }

  return {
    getFareWaveformFromStore,
    getSyncStatus,
    resetForTests,
    refreshSchedule,
    initSchedule,
    parseRemotePayload,
  };
}
