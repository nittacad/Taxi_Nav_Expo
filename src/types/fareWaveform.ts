/**
 * Station Fare Waveform types
 * 鉄道運賃（起点→東京）をプロキシとした出口別波形データ
 */

export type DayCategory = 'weekday' | 'weekend_holiday';

/** @deprecated 旧 UI 互換 — resolveDayCategory で weekday | weekend_holiday に統合 */
export type LegacyDayCategory =
  | DayCategory
  | 'saturday'
  | 'sunday'
  | 'holiday';

/** 始発〜終電（1日）または 2 時間スロット（slot_分オフセット） */
export type TimePreset = 'full_day' | `slot_${number}` | string;

export const DEFAULT_TIME_PRESET: TimePreset = 'slot_1020';

export type OverlayMode = 'off' | 'capacity' | 'trainCount';

/** 駅ごとに異なる出口 ID（スラッグ） */
export type ExitId = string;

export type AirportOrigin = 'narita' | 'haneda';

/** 空港アクセス路線の案内色キー */
export type AirportAccessLineKey =
  | 'naritaExpress'
  | 'keikyuAirport'
  | 'hanedaMonorail'
  | 'keiseiSkyliner'
  | 'keiseiSkyAccess';

export const AIRPORT_ACCESS_LINE_META: Record<
  AirportAccessLineKey,
  {
    color: string;
    shortLabel: string;
    bannerLabel: string;
  }
> = {
  naritaExpress: {
    color: '#0D83C3',
    shortLabel: 'NEX',
    bannerLabel: '成田 NEX',
  },
  keikyuAirport: {
    color: '#FA9715',
    shortLabel: '京急',
    bannerLabel: '羽田 京急快特',
  },
  hanedaMonorail: {
    color: '#0B70B8',
    shortLabel: 'モノレ',
    bannerLabel: '羽田 モノレール',
  },
  keiseiSkyliner: {
    color: '#005AAA',
    shortLabel: 'スカイ',
    bannerLabel: '成田 スカイライナー',
  },
  keiseiSkyAccess: {
    color: '#EC7B02',
    shortLabel: 'アクセス',
    bannerLabel: '成田 スカイアクセス',
  },
};

export interface AirportArrivalHighlight {
  minuteIndex: number;
  timeLabel: string;
  origin: AirportOrigin;
  lineKey: AirportAccessLineKey;
  markerColor: string;
  shortLabel: string;
  trainLabel: string;
  exitId: ExitId;
  fare: number;
}

export const AIRPORT_ORIGIN_LABELS: Record<AirportOrigin, string> = {
  narita: '成田空港',
  haneda: '羽田空港',
};

/** グラフマーカー・バナー用の短縮ラベル */
export const AIRPORT_ORIGIN_SHORT_LABELS: Record<AirportOrigin, string> = {
  narita: '成田',
  haneda: '羽田',
};

export const AIRPORT_ORIGIN_ORDER: AirportOrigin[] = ['narita', 'haneda'];

/** @deprecated markerColor / lineKey を使用 */
export const AIRPORT_MARKER_COLORS: Record<AirportOrigin, string> = {
  narita: AIRPORT_ACCESS_LINE_META.naritaExpress.color,
  haneda: AIRPORT_ACCESS_LINE_META.keikyuAirport.color,
};

export interface ExitFareWaveformSeries {
  exitId: ExitId;
  exitName: string;
  lines: string;
  color: string;
  fareByMinute: number[];
  capacityByMinute: number[];
  trainCountByMinute: number[];
}

export interface StationFareWaveformStats {
  peakFare: number;
  peakFareExitName: string;
  peakTime: string;
  arrivalEventCount: number;
  extraTrainCount: number;
  naritaArrivalCount: number;
  hanedaArrivalCount: number;
}

export interface StationFareWaveformData {
  stationId: number;
  stationName: string;
  dayCategory: DayCategory;
  timePreset: TimePreset;
  slotCount: number;
  startTime: string;
  endTime: string;
  timeLabels: string[];
  exits: ExitFareWaveformSeries[];
  totalCapacityByMinute: number[];
  trainCountByMinute: number[];
  airportHighlights: AirportArrivalHighlight[];
  stats: StationFareWaveformStats;
}

export type FareWaveformLayerVisibility = Record<string, boolean>;

export function createDefaultLayerVisibility(
  exits: readonly { exitId: string }[],
): FareWaveformLayerVisibility {
  return Object.fromEntries(exits.map((exit) => [exit.exitId, true]));
}

/** @deprecated createDefaultLayerVisibility を使用 */
export const DEFAULT_LAYER_VISIBILITY: FareWaveformLayerVisibility = {
  yaesu: true,
  nihonbashi: true,
  maruNorth: true,
  maruSouth: true,
  shinkansen: true,
};

/** @deprecated exitId をそのまま layerVisibility のキーに使用 */
export const EXIT_ID_TO_LAYER_KEY: Record<string, string> = {
  yaesu: 'yaesu',
  nihonbashi: 'nihonbashi',
  'maru-north': 'maruNorth',
  'maru-south': 'maruSouth',
  shinkansen: 'shinkansen',
};

export const DAY_CATEGORY_LABELS: Record<DayCategory, string> = {
  weekday: '平日',
  weekend_holiday: '土日祝',
};

export const OVERLAY_MODE_LABELS: Record<OverlayMode, string> = {
  off: 'オーバーレイなし',
  capacity: '収容人数',
  trainCount: '到着本数/分',
};

/** 凡例パネル内の短縮ラベル */
export const OVERLAY_MODE_SHORT_LABELS: Record<OverlayMode, string> = {
  off: 'なし',
  capacity: '収容',
  trainCount: '本数',
};

export interface ExitPeakSummary {
  exitId: ExitId;
  exitName: string;
  color: string;
  peakFare: number;
  peakTime: string;
}

export const DEFAULT_ZOOM_PX_PER_MINUTE = 8;

/** 1日表示時の初期ズーム（横スクロール量を抑える） */
export const FULL_DAY_DEFAULT_ZOOM_PX_PER_MINUTE = 4;

export const ZOOM_LEVELS = [4, 6, 8, 12, 16] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

/** 東京駅 — JSON 配信（fareWaveformTokyoRemoteStore） */
export const FARE_WAVEFORM_TOKYO_STATION_ID = 1;

export const FARE_WAVEFORM_SUPPORTED_STATION_IDS: ReadonlySet<number> = new Set([
  FARE_WAVEFORM_TOKYO_STATION_ID, // 東京（JSON）
  3, // 品川（モック）
  6, // 上野（モック）
]);

export function resolveDayCategory(value: string): DayCategory {
  if (value === 'weekday') {
    return 'weekday';
  }
  return 'weekend_holiday';
}

export function resolveTimePreset(value: string): TimePreset {
  const legacy: Record<string, TimePreset> = {
    full: 'full_day',
    peak: DEFAULT_TIME_PRESET,
    peak_narrow: DEFAULT_TIME_PRESET,
    evening: 'slot_1080',
    morning: DEFAULT_TIME_PRESET,
  };
  const mapped = legacy[value] ?? value;
  if (mapped === 'full_day') {
    return 'full_day';
  }
  if (mapped.startsWith('slot_')) {
    return mapped;
  }
  return DEFAULT_TIME_PRESET;
}

export function isTwoHourTimePreset(preset: TimePreset): boolean {
  return typeof preset === 'string' && preset.startsWith('slot_');
}

export function zoomStep(current: ZoomLevel, direction: -1 | 1): ZoomLevel {
  const idx = ZOOM_LEVELS.indexOf(current);
  const base = idx >= 0 ? idx : ZOOM_LEVELS.indexOf(DEFAULT_ZOOM_PX_PER_MINUTE);
  const next = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, base + direction));
  return ZOOM_LEVELS[next];
}
