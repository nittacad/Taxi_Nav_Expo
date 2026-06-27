/**
 * 実機テスト用プリセット（Settings の開発パネル）
 */

export interface NotificationTestPreset {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  hour: number;
  minute: number;
  description: string;
  /** 六曜テスト用の固定日付（month: 0始まり） */
  calendarDate?: { year: number; month: number; day: number };
}

export function buildTestDate(
  hour: number,
  minute: number,
  baseDate: Date = new Date()
): Date {
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function buildTestDateFromPreset(preset: NotificationTestPreset): Date {
  const base = preset.calendarDate
    ? new Date(preset.calendarDate.year, preset.calendarDate.month, preset.calendarDate.day)
    : new Date();
  return buildTestDate(preset.hour, preset.minute, base);
}

export const NOTIFICATION_TEST_PRESETS: readonly NotificationTestPreset[] = [
  {
    id: 'imperial_checkout',
    label: '帝国ホテル 11:30',
    latitude: 35.6750,
    longitude: 139.7709,
    hour: 11,
    minute: 30,
    description: 'checkout_base · 12:00 CO の60分前ウィンドウ',
  },
  {
    id: 'okura_checkout',
    label: 'オークラ東京 11:30',
    latitude: 35.6654,
    longitude: 139.7317,
    hour: 11,
    minute: 30,
    description: 'checkout_base · 12:00 CO',
  },
  {
    id: 'tobu_checkout',
    label: '東武レバント 10:30',
    latitude: 35.6960,
    longitude: 139.8138,
    hour: 10,
    minute: 30,
    description: 'checkout_base · 11:00 CO',
  },
  {
    id: 'tokyo_kaikan',
    label: '東京會舘 20:45',
    latitude: 35.6790,
    longitude: 139.7638,
    hour: 20,
    minute: 45,
    description: 'event_base · 21:00 宴終了の30分前',
  },
  {
    id: 'tokyo_kaikan_taian',
    label: '東京會舘 大安',
    latitude: 35.6790,
    longitude: 139.7638,
    hour: 20,
    minute: 45,
    calendarDate: { year: 2026, month: 5, day: 20 },
    description: 'event_base · 大安のみ六曜通知',
  },
  {
    id: 'imperial_taian',
    label: '帝国ホテル 大安',
    latitude: 35.6723,
    longitude: 139.7584,
    hour: 11,
    minute: 30,
    calendarDate: { year: 2026, month: 5, day: 20 },
    description: 'checkout_base · 大安・結婚式需要強化',
  },
  {
    id: 'agm_tif_taian',
    label: '株主総会 TIF',
    latitude: 35.6766,
    longitude: 139.7648,
    hour: 12,
    minute: 0,
    calendarDate: { year: 2026, month: 5, day: 25 },
    description: 'A-009 · 東京国際フォーラム 10:00開始→13:00終了の60分前',
  },
  {
    id: 'happo_en',
    label: '八芳園 20:45',
    latitude: 35.5966,
    longitude: 139.7487,
    hour: 20,
    minute: 45,
    description: 'event_base · 21:00 宴終了',
  },
] as const;
