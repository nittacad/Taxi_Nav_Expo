/**
 * fareWaveformEngine.ts
 * 駅別運賃波形モックの共通合成エンジン
 */

import {
  AirportAccessLineKey,
  AirportArrivalHighlight,
  AirportOrigin,
  AIRPORT_ORIGIN_SHORT_LABELS,
  DayCategory,
  ExitFareWaveformSeries,
  ExitPeakSummary,
  FareWaveformLayerVisibility,
  StationFareWaveformData,
  StationFareWaveformStats,
  TimePreset,
  resolveDayCategory,
  resolveTimePreset,
} from '@/types/fareWaveform';

export const JR_BASE_FARE = 310;
export const METRO_BASE_FARE = 200;

/** モック上の始発〜終電（終電の約30分前まで） */
export const SERVICE_DAY = {
  firstTrainMinute: 5 * 60,
  lastTrainMinute: 23 * 60 + 30,
} as const;

export const TWO_HOUR_SLOT_MINUTES = 120;

export interface TimePresetOption {
  id: TimePreset;
  label: string;
  isFullDay: boolean;
}

export interface ResolvedTimeRange {
  start: number;
  end: number;
  label: string;
  isTwoHour: boolean;
}

export function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Hermes 実機で Math.max(...array) が落ちるためループで最大値を求める */
export function seriesMax(values: readonly number[], floor = 0): number {
  let max = floor;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) {
      max = values[i];
    }
  }
  return max;
}

export function resolveTimeRange(preset: TimePreset): ResolvedTimeRange {
  const key = typeof preset === 'string' ? preset : String(preset);

  if (key === 'full_day') {
    return {
      start: SERVICE_DAY.firstTrainMinute,
      end: SERVICE_DAY.lastTrainMinute,
      label: `${minuteToLabel(SERVICE_DAY.firstTrainMinute)}–${minuteToLabel(SERVICE_DAY.lastTrainMinute)}（始発〜終電）`,
      isTwoHour: false,
    };
  }

  if (key.startsWith('slot_')) {
    const start = Number.parseInt(key.slice(5), 10);
    if (!Number.isNaN(start)) {
      const end = Math.min(
        start + TWO_HOUR_SLOT_MINUTES - 1,
        SERVICE_DAY.lastTrainMinute,
      );
      const labelEnd =
        end - start + 1 >= TWO_HOUR_SLOT_MINUTES
          ? start + TWO_HOUR_SLOT_MINUTES
          : end;
      return {
        start,
        end,
        label: `${minuteToLabel(start)}–${minuteToLabel(labelEnd)}`,
        isTwoHour: true,
      };
    }
  }

  const fallbackStart = 17 * 60;
  const fallbackEnd = fallbackStart + TWO_HOUR_SLOT_MINUTES - 1;
  return {
    start: fallbackStart,
    end: fallbackEnd,
    label: `${minuteToLabel(fallbackStart)}–${minuteToLabel(fallbackEnd)}`,
    isTwoHour: true,
  };
}

export function listTimePresetOptions(): TimePresetOption[] {
  const options: TimePresetOption[] = [
    {
      id: 'full_day',
      label: resolveTimeRange('full_day').label,
      isFullDay: true,
    },
  ];

  for (
    let start = SERVICE_DAY.firstTrainMinute;
    start < SERVICE_DAY.lastTrainMinute;
    start += TWO_HOUR_SLOT_MINUTES
  ) {
    const range = resolveTimeRange(`slot_${start}`);
    options.push({
      id: `slot_${start}`,
      label: range.label,
      isFullDay: false,
    });
  }

  return options;
}

export type FareWaveformExitDef = {
  id: string;
  name: string;
  lines: string;
  lineColor: string;
  defaultBase: number;
};

export type FareWaveformArrivalEvent = {
  minute: number;
  exitId: string;
  fare: number;
  capacity: number;
  trainId: string;
  isExtra?: boolean;
  airportOrigin?: AirportOrigin;
  airportLineKey?: AirportAccessLineKey;
};

type MinuteAggregate = {
  maxFare: number;
  totalCapacity: number;
  trainCount: number;
};

export function computeExitPeaks(
  exits: ExitFareWaveformSeries[],
  timeLabels: string[],
  layerVisibility: FareWaveformLayerVisibility,
): ExitPeakSummary[] {
  return exits
    .filter((exit) => layerVisibility[exit.exitId] ?? true)
    .map((exit) => {
      let peakFare = 0;
      let peakIdx = 0;
      exit.fareByMinute.forEach((fare, index) => {
        if (fare > peakFare) {
          peakFare = fare;
          peakIdx = index;
        }
      });
      return {
        exitId: exit.exitId,
        exitName: exit.exitName,
        color: exit.color,
        peakFare,
        peakTime: timeLabels[peakIdx] ?? '--:--',
      };
    })
    .sort((a, b) => b.peakFare - a.peakFare);
}

export function hash01(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

export function hashInt(seed: string, mod: number): number {
  return Math.floor(hash01(seed) * mod);
}

export function isWeekendLike(day: DayCategory): boolean {
  return day === 'weekend_holiday';
}

export function jrLocalFare(day: DayCategory, minute: number, trainIdx: number): number {
  const h = hash01(`${day}-jr-${minute}-${trainIdx}`);
  if (h > 0.92) {
    return 800 + hashInt(`${day}-jrlong-${minute}`, 2500);
  }
  if (h > 0.75) {
    return 400 + hashInt(`${day}-jrmed-${minute}`, 400);
  }
  return 170 + hashInt(`${day}-jrsht-${minute}-${trainIdx}`, 140);
}

export function metroFare(day: DayCategory, minute: number, trainIdx: number): number {
  const h = hash01(`${day}-metro-${minute}-${trainIdx}`);
  if (h > 0.88) {
    return 600 + hashInt(`${day}-metrolong-${minute}`, 2200);
  }
  return 170 + hashInt(`${day}-metrosht-${minute}-${trainIdx}`, 130);
}

export function shinkansenFare(day: DayCategory, minute: number, seq: number): number {
  const h = hash01(`${day}-sk-${minute}-${seq}`);
  return 3500 + Math.floor(h * 11500);
}

export function keiseiFare(day: DayCategory, minute: number, trainIdx: number): number {
  const h = hash01(`${day}-keisei-${minute}-${trainIdx}`);
  if (h > 0.9) {
    return 2500 + hashInt(`${day}-keisei-long-${minute}`, 2000);
  }
  if (h > 0.7) {
    return 900 + hashInt(`${day}-keisei-mid-${minute}`, 800);
  }
  return 260 + hashInt(`${day}-keisei-sht-${minute}-${trainIdx}`, 200);
}

export function trainCapacity(
  kind: 'jr_commuter' | 'jr_rapid' | 'metro' | 'shinkansen' | 'keisei',
  seed: string,
): number {
  if (kind === 'shinkansen') {
    return hash01(seed) > 0.45 ? 1323 : 731;
  }
  if (kind === 'keisei') {
    return 400 + hashInt(seed, 600);
  }
  if (kind === 'jr_rapid') {
    return 900 + hashInt(seed, 600);
  }
  if (kind === 'metro') {
    return 500 + hashInt(seed, 500);
  }
  return 600 + hashInt(seed, 900);
}

function emptyAggregates(
  exits: FareWaveformExitDef[],
  slotCount: number,
): Record<string, MinuteAggregate[]> {
  const out: Record<string, MinuteAggregate[]> = {};
  for (const exit of exits) {
    out[exit.id] = Array.from({ length: slotCount }, () => ({
      maxFare: exit.defaultBase,
      totalCapacity: 0,
      trainCount: 0,
    }));
  }
  return out;
}

export function aggregateEvents(
  events: FareWaveformArrivalEvent[],
  viewStart: number,
  viewEnd: number,
  exits: FareWaveformExitDef[],
): Record<string, MinuteAggregate[]> {
  const slotCount = viewEnd - viewStart + 1;
  const agg = emptyAggregates(exits, slotCount);

  for (const ev of events) {
    if (ev.minute < viewStart || ev.minute > viewEnd) {
      continue;
    }
    const slot = agg[ev.exitId];
    if (!slot) {
      continue;
    }
    const idx = ev.minute - viewStart;
    slot[idx].maxFare = Math.max(slot[idx].maxFare, ev.fare);
    slot[idx].totalCapacity += ev.capacity;
    slot[idx].trainCount += 1;
  }

  return agg;
}

function buildTotalCapacitySeries(
  agg: Record<string, MinuteAggregate[]>,
  exits: FareWaveformExitDef[],
): number[] {
  const len = agg[exits[0].id].length;
  return Array.from({ length: len }, (_, i) =>
    exits.reduce((sum, e) => sum + agg[e.id][i].totalCapacity, 0),
  );
}

function buildTrainCountSeries(
  agg: Record<string, MinuteAggregate[]>,
  exits: FareWaveformExitDef[],
): number[] {
  const len = agg[exits[0].id].length;
  return Array.from({ length: len }, (_, i) =>
    exits.reduce((sum, e) => sum + agg[e.id][i].trainCount, 0),
  );
}

export function buildStats(
  exits: FareWaveformExitDef[],
  agg: Record<string, MinuteAggregate[]>,
  viewStart: number,
  events: FareWaveformArrivalEvent[],
): StationFareWaveformStats {
  let peakFare = JR_BASE_FARE;
  let peakFareExitName = exits[0]?.name ?? '';
  let peakTime = minuteToLabel(viewStart);

  for (const exit of exits) {
    agg[exit.id].forEach((slot, i) => {
      if (slot.maxFare > peakFare) {
        peakFare = slot.maxFare;
        peakFareExitName = exit.name;
        peakTime = minuteToLabel(viewStart + i);
      }
    });
  }

  const viewEnd = viewStart + (agg[exits[0].id]?.length ?? 1) - 1;
  const inView = (e: FareWaveformArrivalEvent) =>
    e.minute >= viewStart && e.minute <= viewEnd;

  return {
    peakFare,
    peakFareExitName,
    peakTime,
    arrivalEventCount: events.filter(inView).length,
    extraTrainCount: events.filter((e) => e.isExtra && inView(e)).length,
    naritaArrivalCount: events.filter(
      (e) => e.airportOrigin === 'narita' && inView(e),
    ).length,
    hanedaArrivalCount: events.filter(
      (e) => e.airportOrigin === 'haneda' && inView(e),
    ).length,
  };
}

export function buildAirportHighlights(
  events: FareWaveformArrivalEvent[],
  viewStart: number,
  viewEnd: number,
  exitColorById: Record<string, string>,
): AirportArrivalHighlight[] {
  return events
    .filter(
      (e) =>
        e.airportOrigin &&
        e.minute >= viewStart &&
        e.minute <= viewEnd,
    )
    .map((e) => {
      const origin = e.airportOrigin as AirportOrigin;
      const lineKey = e.airportLineKey as AirportAccessLineKey;
      return {
        minuteIndex: e.minute - viewStart,
        timeLabel: minuteToLabel(e.minute),
        origin,
        lineKey,
        markerColor: exitColorById[e.exitId] ?? '#7F8C8D',
        shortLabel: AIRPORT_ORIGIN_SHORT_LABELS[origin],
        trainLabel: e.trainId,
        exitId: e.exitId,
        fare: e.fare,
      };
    })
    .sort((a, b) => a.minuteIndex - b.minuteIndex);
}

export function assembleStationFareWaveform(params: {
  stationId: number;
  stationName: string;
  dayCategoryInput: string;
  timePresetInput?: string;
  exits: FareWaveformExitDef[];
  events: FareWaveformArrivalEvent[];
  genLagMinutes?: number;
}): StationFareWaveformData {
  const dayCategory = resolveDayCategory(params.dayCategoryInput);
  const timePreset = resolveTimePreset(params.timePresetInput ?? 'slot_1020');
  const preset = resolveTimeRange(timePreset);
  const viewStart = preset.start;
  const viewEnd = preset.end;
  const lag = params.genLagMinutes ?? 0;
  const exitColorById = Object.fromEntries(
    params.exits.map((exit) => [exit.id, exit.lineColor]),
  );

  const agg = aggregateEvents(params.events, viewStart, viewEnd, params.exits);
  const slotCount = viewEnd - viewStart + 1;
  const timeLabels = Array.from({ length: slotCount }, (_, i) =>
    minuteToLabel(viewStart + i),
  );

  const exits: ExitFareWaveformSeries[] = params.exits.map((exit) => ({
    exitId: exit.id,
    exitName: exit.name,
    lines: exit.lines,
    color: exit.lineColor,
    fareByMinute: agg[exit.id].map((s) => s.maxFare),
    capacityByMinute: agg[exit.id].map((s) => s.totalCapacity),
    trainCountByMinute: agg[exit.id].map((s) => s.trainCount),
  }));

  return {
    stationId: params.stationId,
    stationName: params.stationName,
    dayCategory,
    timePreset,
    slotCount,
    startTime: minuteToLabel(viewStart),
    endTime: minuteToLabel(viewEnd),
    timeLabels,
    exits,
    totalCapacityByMinute: buildTotalCapacitySeries(agg, params.exits),
    trainCountByMinute: buildTrainCountSeries(agg, params.exits),
    airportHighlights: buildAirportHighlights(
      params.events,
      viewStart,
      viewEnd,
      exitColorById,
    ),
    stats: buildStats(params.exits, agg, viewStart, params.events),
  };
}

export function contrastCheckColor(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#141414' : '#FFFFFF';
}
