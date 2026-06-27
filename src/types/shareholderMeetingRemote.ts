/**
 * リモート配信用 JSON ペイロード（iPhone 起動時に取得）
 */

import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';

export interface ShareholderMeetingsRemotePayload {
  version: number;
  generatedAt: string;
  rangeSince?: string;
  rangeUntil?: string;
  meetings: ScheduledShareholderMeeting[];
}

export const SHAREHOLDER_MEETINGS_JSON_VERSION = 1;

export const REMOTE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
