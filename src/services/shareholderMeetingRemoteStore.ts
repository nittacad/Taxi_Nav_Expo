/**
 * 株主総会スケジュール — リモート JSON 取得 + 端末内キャッシュ
 * URL 未設定時は同梱データ（generated.ts）のみ使用
 */

import Constants from 'expo-constants';

import { SHAREHOLDER_MEETING_SCHEDULE_IMPORTED } from '@/data/shareholderMeetingSchedule.generated';
import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';
import {
  REMOTE_REFRESH_INTERVAL_MS,
  SHAREHOLDER_MEETINGS_JSON_VERSION,
  type ShareholderMeetingsRemotePayload,
} from '@/types/shareholderMeetingRemote';

const FETCH_TIMEOUT_MS = 12_000;

let activeSchedule: ScheduledShareholderMeeting[] = [...SHAREHOLDER_MEETING_SCHEDULE_IMPORTED];
let lastRemoteFetchAt: number | null = null;
let lastRemoteSource: 'bundled' | 'remote' | 'cache' = 'bundled';
let lastRemoteError: string | null = null;
let initPromise: Promise<void> | null = null;

export interface ShareholderMeetingSyncStatus {
  source: 'bundled' | 'remote' | 'cache';
  meetingCount: number;
  lastFetchAt: string | null;
  remoteUrl: string | null;
  lastError: string | null;
}

function getRemoteJsonUrl(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.shareholderMeetingsJsonUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  return null;
}

function isValidMeeting(raw: unknown): raw is ScheduledShareholderMeeting {
  if (!raw || typeof raw !== 'object') return false;
  const m = raw as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.companyName === 'string' &&
    typeof m.venueName === 'string' &&
    typeof m.meetingDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.meetingDate) &&
    typeof m.startTime === 'string' &&
    typeof m.participantCount === 'number' &&
    m.participantCount > 0
  );
}

export function parseShareholderMeetingsRemotePayload(
  data: unknown
): ScheduledShareholderMeeting[] | null {
  if (!data || typeof data !== 'object') return null;
  const payload = data as ShareholderMeetingsRemotePayload;
  if (payload.version !== SHAREHOLDER_MEETINGS_JSON_VERSION) return null;
  if (!Array.isArray(payload.meetings)) return null;

  const meetings = payload.meetings.filter(isValidMeeting);
  if (meetings.length === 0) return null;

  meetings.sort((a, b) => {
    if (a.meetingDate !== b.meetingDate) return a.meetingDate.localeCompare(b.meetingDate);
    return a.startTime.localeCompare(b.startTime);
  });

  return meetings;
}

function shouldSkipNetworkFetch(force: boolean): boolean {
  if (force) return false;
  if (lastRemoteFetchAt == null) return false;
  return Date.now() - lastRemoteFetchAt < REMOTE_REFRESH_INTERVAL_MS;
}

async function fetchRemoteSchedule(url: string): Promise<ScheduledShareholderMeeting[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const cacheBust = `t=${Date.now()}`;
    const fetchUrl = url.includes('?') ? `${url}&${cacheBust}` : `${url}?${cacheBust}`;
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json: unknown = await response.json();
    return parseShareholderMeetingsRemotePayload(json);
  } finally {
    clearTimeout(timer);
  }
}

export function getActiveShareholderMeetingSchedule(): readonly ScheduledShareholderMeeting[] {
  return activeSchedule;
}

export function getShareholderMeetingSyncStatus(): ShareholderMeetingSyncStatus {
  return {
    source: lastRemoteSource,
    meetingCount: activeSchedule.length,
    lastFetchAt: lastRemoteFetchAt ? new Date(lastRemoteFetchAt).toISOString() : null,
    remoteUrl: getRemoteJsonUrl(),
    lastError: lastRemoteError,
  };
}

export function resetShareholderMeetingScheduleForTests(
  meetings: ScheduledShareholderMeeting[] = [...SHAREHOLDER_MEETING_SCHEDULE_IMPORTED]
): void {
  activeSchedule = [...meetings];
  lastRemoteFetchAt = null;
  lastRemoteSource = 'bundled';
  lastRemoteError = null;
  initPromise = null;
}

export async function refreshShareholderMeetingSchedule(
  options: { force?: boolean } = {}
): Promise<ShareholderMeetingSyncStatus> {
  const url = getRemoteJsonUrl();
  if (!url) {
    lastRemoteSource = 'bundled';
    lastRemoteError = null;
    return getShareholderMeetingSyncStatus();
  }

  if (shouldSkipNetworkFetch(options.force ?? false)) {
    return getShareholderMeetingSyncStatus();
  }

  try {
    const remote = await fetchRemoteSchedule(url);
    lastRemoteFetchAt = Date.now();
    if (remote && remote.length > 0) {
      activeSchedule = remote;
      lastRemoteSource = 'remote';
      lastRemoteError = null;
    } else {
      lastRemoteSource = activeSchedule.length > 0 ? 'cache' : 'bundled';
      lastRemoteError = 'リモート JSON が空または形式不正';
    }
  } catch (error) {
    lastRemoteFetchAt = Date.now();
    lastRemoteError = error instanceof Error ? error.message : 'fetch failed';
    lastRemoteSource = activeSchedule.length > 0 ? 'cache' : 'bundled';
  }

  return getShareholderMeetingSyncStatus();
}

export function initShareholderMeetingSchedule(): Promise<void> {
  if (!initPromise) {
    initPromise = refreshShareholderMeetingSchedule().then(() => undefined);
  }
  return initPromise;
}
