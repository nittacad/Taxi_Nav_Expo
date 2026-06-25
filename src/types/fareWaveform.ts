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

export type TimePreset = 'peak' | 'peak_narrow' | 'evening';

export type OverlayMode = 'off' | 'capacity' | 'trainCount';

export type ExitId =
  | 'yaesu'
  | 'nihonbashi'
  | 'maru-north'
  | 'maru-south'
  | 'shinkansen';

export type AirportOrigin = 'narita' | 'haneda';

/** 空港アクセス路線の案内色キー */
export type AirportAccessLineKey =
  | 'naritaExpress'
  | 'keikyuAirport'
  | 'hanedaMonorail';

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

export interface FareWaveformLayerVisibility {
  yaesu: boolean;
  nihonbashi: boolean;
  maruNorth: boolean;
  maruSouth: boolean;
  shinkansen: boolean;
}

export const DEFAULT_LAYER_VISIBILITY: FareWaveformLayerVisibility = {
  yaesu: true,
  nihonbashi: true,
  maruNorth: true,
  maruSouth: true,
  shinkansen: true,
};

export const EXIT_ID_TO_LAYER_KEY: Record<
  ExitId,
  keyof FareWaveformLayerVisibility
> = {
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

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  peak: '17:00–19:00（2時間・高密度）',
  peak_narrow: '17:30–18:30（1時間）',
  evening: '18:00–20:00（2時間）',
};

export const OVERLAY_MODE_LABELS: Record<OverlayMode, string> = {
  off: 'オーバーレイなし',
  capacity: '収容人数',
  trainCount: '到着本数/分',
};

export const DEFAULT_ZOOM_PX_PER_MINUTE = 8;

export const ZOOM_LEVELS = [6, 8, 12, 16] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

export const FARE_WAVEFORM_SUPPORTED_STATION_IDS: ReadonlySet<number> = new Set([1]);

export function resolveDayCategory(value: string): DayCategory {
  if (value === 'weekday') {
    return 'weekday';
  }
  return 'weekend_holiday';
}

export function resolveTimePreset(value: string): TimePreset {
  const legacy: Record<string, TimePreset> = {
    full: 'peak',
    morning: 'peak_narrow',
  };
  const mapped = legacy[value] ?? value;
  if (mapped === 'peak' || mapped === 'peak_narrow' || mapped === 'evening') {
    return mapped;
  }
  return 'peak';
}

export function zoomStep(current: ZoomLevel, direction: -1 | 1): ZoomLevel {
  const idx = ZOOM_LEVELS.indexOf(current);
  const base = idx >= 0 ? idx : ZOOM_LEVELS.indexOf(DEFAULT_ZOOM_PX_PER_MINUTE);
  const next = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, base + direction));
  return ZOOM_LEVELS[next];
}
