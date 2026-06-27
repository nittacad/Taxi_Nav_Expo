import type { AppNotificationRecord, NotificationCategory } from '@/types/notificationList';
import { NOTIFICATION_CATEGORY_LABELS } from '@/types/notificationList';
import {
  getDemandColor,
  getDemandLevelColor,
  getDemandLevelLabel,
  type DemandLevel,
} from '@/utils/demandLevel';

export interface NotificationRowDisplay {
  typeLabel: string;
  marker: string;
  placeName: string;
  infoLine: string;
  demandLevel?: DemandLevel;
  demandLevelLabel: string;
  demandLevelColor: string;
  predictedDemand?: number;
}

function extractVenueMarker(body: string): string {
  const firstLine = body.split('\n').find((line) => line.trim().length > 0) ?? body;
  if (firstLine.startsWith('🟠')) return '🟠';
  return '🔴';
}

function extractVenueName(body: string): string {
  const firstLine = body.split('\n').find((line) => line.trim().length > 0) ?? body;
  return firstLine
    .replace(/^🔴\s*/, '')
    .replace(/^🟠\s*/, '')
    .replace(/【需要ブースト(?:・[^】]+)?】/, '')
    .replace(/【大需要ブースト】/, '')
    .replace('【高需要】', '')
    .trim();
}

function extractShareholderInfoLine(body: string): string {
  const endLine = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.includes('株主総会終了予定'));
  if (endLine) return endLine;

  const participants = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('参加者数:'));
  return participants ?? '';
}

function extractVenueInfoLine(body: string): string {
  const rokuyouLine = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('六曜:'));
  if (rokuyouLine) return rokuyouLine;

  const triggerLine = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.includes('チェックアウト') || line.includes('披露宴'));
  if (triggerLine) return triggerLine;

  const withoutArrow = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('→') && !line.startsWith('🔴') && !line.startsWith('🟠'))
    .find((line) => !line.includes('【需要ブースト】') && !line.includes('【高需要】'));

  return withoutArrow ?? '';
}

function parseVenueBoost(body: string): Pick<NotificationRowDisplay, 'placeName' | 'infoLine'> {
  return {
    placeName: extractVenueName(body),
    infoLine: extractVenueInfoLine(body),
  };
}

function parseStationDemand(body: string, title: string): Pick<NotificationRowDisplay, 'placeName' | 'infoLine'> {
  const stationMatch = body.match(/^(.+?)付近で/);
  const distMatch = body.match(/（([\d.]+)km圏内）/);

  return {
    placeName: stationMatch?.[1] ?? title,
    infoLine: distMatch ? `${distMatch[1]}km圏内` : '需要が高まっています',
  };
}

function inferDemandLevel(record: AppNotificationRecord): DemandLevel | undefined {
  if (record.demandLevel) return record.demandLevel;
  if (record.category === 'station_demand') return 'high';
  if (record.category === 'venue_boost') {
    return record.body.includes('🟠') ? 'medium' : 'high';
  }
  if (record.category === 'business_chain_boost') {
    return 'high';
  }
  if (record.category === 'rokuyou_boost') {
    return 'high';
  }
  if (record.category === 'shareholder_meeting_boost') {
    return 'high';
  }
  return undefined;
}

function buildDemandDisplay(record: AppNotificationRecord): Pick<
  NotificationRowDisplay,
  'demandLevel' | 'demandLevelLabel' | 'demandLevelColor' | 'predictedDemand'
> {
  const demandLevel = inferDemandLevel(record);
  if (!demandLevel) {
    return {
      demandLevel: undefined,
      demandLevelLabel: '',
      demandLevelColor: '',
      predictedDemand: record.predictedDemand,
    };
  }

  const demandLevelColor =
    record.predictedDemand != null
      ? getDemandColor(record.predictedDemand)
      : getDemandLevelColor(demandLevel);

  return {
    demandLevel,
    demandLevelLabel: getDemandLevelLabel(demandLevel),
    demandLevelColor,
    predictedDemand: record.predictedDemand,
  };
}

export function parseNotificationForList(record: AppNotificationRecord): NotificationRowDisplay {
  const typeLabel = NOTIFICATION_CATEGORY_LABELS[record.category];
  const demandDisplay = buildDemandDisplay(record);

  if (record.category === 'shareholder_meeting_boost') {
    const placeName = extractVenueName(record.body) || record.title;
    return {
      typeLabel,
      marker: extractVenueMarker(record.body),
      placeName,
      infoLine: extractShareholderInfoLine(record.body),
      ...demandDisplay,
    };
  }

  if (record.category === 'venue_boost' || record.category === 'business_chain_boost' || record.category === 'rokuyou_boost') {
    const parsed = parseVenueBoost(record.body);
    return {
      typeLabel,
      marker: extractVenueMarker(record.body),
      placeName: parsed.placeName || record.title,
      infoLine: parsed.infoLine,
      ...demandDisplay,
    };
  }

  if (record.category === 'station_demand') {
    const parsed = parseStationDemand(record.body, record.title);
    return { typeLabel, marker: '', ...parsed, ...demandDisplay };
  }

  const firstLine = record.body.split('\n')[0]?.trim() ?? record.body;
  return {
    typeLabel,
    marker: '',
    placeName: record.title,
    infoLine: firstLine !== record.title ? firstLine : record.body,
    ...demandDisplay,
  };
}

export function formatNotificationTime(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp);
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  if (isToday) return `${hours}:${minutes}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
}

/** @internal テスト用 */
export function parseNotificationBody(
  title: string,
  body: string,
  category: NotificationCategory,
  extras: Pick<AppNotificationRecord, 'demandLevel' | 'predictedDemand'> = {}
): NotificationRowDisplay {
  return parseNotificationForList({
    id: 'test',
    title,
    body,
    category,
    receivedAt: 0,
    read: false,
    ...extras,
  });
}
