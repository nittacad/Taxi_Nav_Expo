/**
 * Tokyo Station fare waveform mock — Canvas v2 高密度イベント合成
 */

import {
  AirportAccessLineKey,
  AirportArrivalHighlight,
  AirportOrigin,
  AIRPORT_ORIGIN_SHORT_LABELS,
  DayCategory,
  ExitFareWaveformSeries,
  ExitId,
  StationFareWaveformData,
  StationFareWaveformStats,
  TimePreset,
  resolveDayCategory,
  resolveTimePreset,
} from '@/types/fareWaveform';

export const JR_BASE_FARE = 310;
export const METRO_BASE_FARE = 200;
export const NIHONBASHI_RESCUE_LAG_MIN = 7;

export const EXIT_LINE_COLORS: Record<ExitId, string> = {
  yaesu: '#80C342',
  nihonbashi: '#009BBF',
  'maru-north': '#F62E36',
  'maru-south': '#FFD400',
  shinkansen: '#0071BC',
};

type ExitDef = {
  id: ExitId;
  name: string;
  lines: string;
  lineColor: string;
  defaultBase: number;
};

const EXITS: ExitDef[] = [
  {
    id: 'yaesu',
    name: '八重洲口',
    lines: 'JR山手・中央・総武・東海道 / 成田エクスプレス / 新幹線客35%分流',
    lineColor: EXIT_LINE_COLORS.yaesu,
    defaultBase: JR_BASE_FARE,
  },
  {
    id: 'nihonbashi',
    name: '日本橋口',
    lines: 'JR / 東西線 / 京急空港便 / 新幹線客25%（到着+7分 Rescue）',
    lineColor: EXIT_LINE_COLORS.nihonbashi,
    defaultBase: METRO_BASE_FARE,
  },
  {
    id: 'maru-north',
    name: '丸の内北口',
    lines: 'JR / 丸ノ内線・日比谷線方面',
    lineColor: EXIT_LINE_COLORS['maru-north'],
    defaultBase: METRO_BASE_FARE,
  },
  {
    id: 'maru-south',
    name: '丸の内南口',
    lines: 'JR / 丸ノ内線・京葉・総武',
    lineColor: EXIT_LINE_COLORS['maru-south'],
    defaultBase: METRO_BASE_FARE,
  },
  {
    id: 'shinkansen',
    name: '新幹線口',
    lines: '東海道・東北・上越・北陸（到着客40%）',
    lineColor: EXIT_LINE_COLORS.shinkansen,
    defaultBase: JR_BASE_FARE,
  },
];

const SHINKANSEN_SPLIT = {
  shinkansen: 0.4,
  yaesu: 0.35,
  nihonbashi: 0.25,
} as const;

const TIME_PRESETS: Record<
  TimePreset,
  { start: number; end: number; label: string }
> = {
  peak: { start: 17 * 60, end: 19 * 60, label: '17:00–19:00（2時間・高密度）' },
  peak_narrow: {
    start: 17 * 60 + 30,
    end: 18 * 60 + 30,
    label: '17:30–18:30（1時間）',
  },
  evening: { start: 18 * 60, end: 20 * 60, label: '18:00–20:00（2時間）' },
};

type ArrivalEvent = {
  minute: number;
  exitId: ExitId;
  fare: number;
  capacity: number;
  trainId: string;
  isExtra?: boolean;
  airportOrigin?: AirportOrigin;
  airportLineKey?: AirportAccessLineKey;
};

/** 成田・羽田発の定期便（本番では空港ダイヤ JSON と連携） */
type AirportTrainTemplate = {
  origin: AirportOrigin;
  lineKey: AirportAccessLineKey;
  trainLabel: string;
  exitId: ExitId;
  /** genStart からの分オフセットで到着するパターン */
  offsetMod: number;
  offsetRemainder: number;
  fare: number;
  capacity: number;
  /** 土日祝は本数を間引く */
  weekendSkip?: boolean;
};

const AIRPORT_TRAIN_TEMPLATES: AirportTrainTemplate[] = [
  {
    origin: 'narita',
    lineKey: 'naritaExpress',
    trainLabel: '成田エクスプレス',
    exitId: 'yaesu',
    offsetMod: 30,
    offsetRemainder: 3,
    fare: 3280,
    capacity: 1200,
  },
  {
    origin: 'narita',
    lineKey: 'naritaExpress',
    trainLabel: '成田エクスプレス（快速）',
    exitId: 'yaesu',
    offsetMod: 30,
    offsetRemainder: 18,
    fare: 3070,
    capacity: 1200,
    weekendSkip: true,
  },
  {
    origin: 'haneda',
    lineKey: 'keikyuAirport',
    trainLabel: '京急空港快特→東西接続',
    exitId: 'nihonbashi',
    offsetMod: 12,
    offsetRemainder: 5,
    fare: 680,
    capacity: 900,
  },
  {
    origin: 'haneda',
    lineKey: 'hanedaMonorail',
    trainLabel: 'モノレール→JR接続',
    exitId: 'yaesu',
    offsetMod: 20,
    offsetRemainder: 10,
    fare: 720,
    capacity: 650,
  },
];

type MinuteAggregate = {
  maxFare: number;
  totalCapacity: number;
  trainCount: number;
};

type ExtraTrainSpec = {
  trainId: string;
  appliesTo: DayCategory;
  minute: number;
  exitId: ExitId;
  fare: number;
  capacity: number;
  shinkansenBurst?: boolean;
};

const EXTRA_TRAIN_SCHEDULE: ExtraTrainSpec[] = [
  {
    trainId: 'EX-NOZ-104',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 25,
    exitId: 'shinkansen',
    fare: 13200,
    capacity: 1323,
    shinkansenBurst: true,
  },
  {
    trainId: 'EX-HOME-LINER',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 52,
    exitId: 'yaesu',
    fare: 2480,
    capacity: 1500,
  },
  {
    trainId: 'EX-TOZAI-HOL',
    appliesTo: 'weekend_holiday',
    minute: 18 * 60 + 15,
    exitId: 'nihonbashi',
    fare: 890,
    capacity: 820,
  },
  {
    trainId: 'EX-MARU-EXP',
    appliesTo: 'weekend_holiday',
    minute: 18 * 60 + 40,
    exitId: 'maru-north',
    fare: 720,
    capacity: 950,
  },
  {
    trainId: 'EX-GW-JR',
    appliesTo: 'weekday',
    minute: 18 * 60 + 30,
    exitId: 'yaesu',
    fare: 3100,
    capacity: 1200,
  },
];

export function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function hash01(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function hashInt(seed: string, mod: number): number {
  return Math.floor(hash01(seed) * mod);
}

function isWeekendLike(day: DayCategory): boolean {
  return day === 'weekend_holiday';
}

function pushShinkansenBurst(
  events: ArrivalEvent[],
  minute: number,
  trainId: string,
  fare: number,
  totalCapacity: number,
  isExtra: boolean,
): void {
  events.push({
    minute,
    exitId: 'shinkansen',
    fare,
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.shinkansen),
    trainId: `${trainId}-gate`,
    isExtra,
  });
  events.push({
    minute: minute + 1,
    exitId: 'yaesu',
    fare,
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.yaesu),
    trainId: `${trainId}-yaesu`,
    isExtra,
  });
  events.push({
    minute: minute + NIHONBASHI_RESCUE_LAG_MIN,
    exitId: 'nihonbashi',
    fare: Math.round(fare * 0.95),
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.nihonbashi),
    trainId: `${trainId}-rescue`,
    isExtra,
  });
}

function jrLocalFare(day: DayCategory, minute: number, trainIdx: number): number {
  const h = hash01(`${day}-jr-${minute}-${trainIdx}`);
  if (h > 0.92) {
    return 800 + hashInt(`${day}-jrlong-${minute}`, 2500);
  }
  if (h > 0.75) {
    return 400 + hashInt(`${day}-jrmed-${minute}`, 400);
  }
  return 170 + hashInt(`${day}-jrsht-${minute}-${trainIdx}`, 140);
}

function metroFare(day: DayCategory, minute: number, trainIdx: number): number {
  const h = hash01(`${day}-metro-${minute}-${trainIdx}`);
  if (h > 0.88) {
    return 600 + hashInt(`${day}-metrolong-${minute}`, 2200);
  }
  return 170 + hashInt(`${day}-metrosht-${minute}-${trainIdx}`, 130);
}

function shinkansenFare(day: DayCategory, minute: number, seq: number): number {
  const h = hash01(`${day}-sk-${minute}-${seq}`);
  return 3500 + Math.floor(h * 11500);
}

function trainCapacity(
  kind: 'jr_commuter' | 'jr_rapid' | 'metro' | 'shinkansen',
  seed: string,
): number {
  if (kind === 'shinkansen') {
    return hash01(seed) > 0.45 ? 1323 : 731;
  }
  if (kind === 'jr_rapid') {
    return 900 + hashInt(seed, 600);
  }
  if (kind === 'metro') {
    return 500 + hashInt(seed, 500);
  }
  return 600 + hashInt(seed, 900);
}

function generateAirportTrainEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): ArrivalEvent[] {
  const events: ArrivalEvent[] = [];
  const weekend = isWeekendLike(day);

  for (let m = genStart; m <= genEnd; m++) {
    for (const template of AIRPORT_TRAIN_TEMPLATES) {
      if (weekend && template.weekendSkip) {
        continue;
      }
      if ((m - genStart) % template.offsetMod !== template.offsetRemainder) {
        continue;
      }

      const fareJitter = hashInt(`${template.origin}-${day}-${m}`, 120);
      events.push({
        minute: m,
        exitId: template.exitId,
        fare: template.fare + fareJitter,
        capacity: template.capacity,
        trainId: `${template.trainLabel}-${minuteToLabel(m)}`,
        airportOrigin: template.origin,
        airportLineKey: template.lineKey,
      });
    }
  }

  return events;
}

function generateExtraTrainEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): ArrivalEvent[] {
  const events: ArrivalEvent[] = [];
  const maxMinute = genEnd + NIHONBASHI_RESCUE_LAG_MIN;

  for (const spec of EXTRA_TRAIN_SCHEDULE) {
    if (spec.appliesTo !== day) {
      continue;
    }
    if (spec.minute < genStart || spec.minute > maxMinute) {
      continue;
    }

    if (spec.shinkansenBurst) {
      pushShinkansenBurst(
        events,
        spec.minute,
        spec.trainId,
        spec.fare,
        spec.capacity,
        true,
      );
      continue;
    }

    events.push({
      minute: spec.minute,
      exitId: spec.exitId,
      fare: spec.fare,
      capacity: spec.capacity,
      trainId: spec.trainId,
      isExtra: true,
    });
  }

  return events;
}

function generateArrivalEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): ArrivalEvent[] {
  const events: ArrivalEvent[] = [];
  const weekend = isWeekendLike(day);
  const jrInterval = weekend ? 3 : 2;
  const metroInterval = weekend ? 4 : 3;

  for (let m = genStart; m <= genEnd; m++) {
    const minOfDay = m;

    if ((minOfDay - genStart) % jrInterval === 0) {
      events.push({
        minute: minOfDay,
        exitId: 'yaesu',
        fare: jrLocalFare(day, minOfDay, 0),
        capacity: trainCapacity('jr_commuter', `jrc-${day}-${minOfDay}-0`),
        trainId: `JR-Y-${minOfDay}-a`,
      });
    }
    if (!weekend && hash01(`jr-y-ex-${day}-${minOfDay}`) > 0.55) {
      events.push({
        minute: minOfDay,
        exitId: 'yaesu',
        fare: jrLocalFare(day, minOfDay, 1),
        capacity: trainCapacity('jr_rapid', `jrr-${day}-${minOfDay}`),
        trainId: `JR-Y-${minOfDay}-b`,
      });
    }
    if ((minOfDay - genStart) % 11 === 4) {
      events.push({
        minute: minOfDay,
        exitId: 'yaesu',
        fare: 1200 + hashInt(`jr-lim-${day}-${minOfDay}`, 2800),
        capacity: trainCapacity('jr_rapid', `jrl-${day}-${minOfDay}`),
        trainId: `JR-Y-LIM-${minOfDay}`,
      });
    }

    if ((minOfDay - genStart) % metroInterval === 1) {
      events.push({
        minute: minOfDay,
        exitId: 'nihonbashi',
        fare: metroFare(day, minOfDay, 0),
        capacity: trainCapacity('metro', `m-nb-${day}-${minOfDay}`),
        trainId: `M-TZ-${minOfDay}`,
      });
    }
    if (hash01(`m-nb-x-${day}-${minOfDay}`) > 0.78) {
      events.push({
        minute: minOfDay,
        exitId: 'nihonbashi',
        fare: metroFare(day, minOfDay, 1),
        capacity: trainCapacity('metro', `m-nb2-${day}-${minOfDay}`),
        trainId: `M-TZ-X-${minOfDay}`,
      });
    }

    if ((minOfDay - genStart) % metroInterval === 0) {
      events.push({
        minute: minOfDay,
        exitId: 'maru-north',
        fare: metroFare(day, minOfDay, 2),
        capacity: trainCapacity('metro', `m-mn-${day}-${minOfDay}`),
        trainId: `M-MN-${minOfDay}`,
      });
    }
    if ((minOfDay - genStart) % (metroInterval + 1) === 2) {
      events.push({
        minute: minOfDay,
        exitId: 'maru-south',
        fare: metroFare(day, minOfDay, 3),
        capacity: trainCapacity('metro', `m-ms-${day}-${minOfDay}`),
        trainId: `M-MS-${minOfDay}`,
      });
    }
    if ((minOfDay - genStart) % 8 === 3) {
      events.push({
        minute: minOfDay,
        exitId: 'maru-south',
        fare: jrLocalFare(day, minOfDay, 4),
        capacity: trainCapacity('jr_commuter', `jr-ms-${day}-${minOfDay}`),
        trainId: `JR-MS-${minOfDay}`,
      });
    }

    const skOffset = weekend ? 14 : 12;
    if ((minOfDay - genStart) % skOffset === 6) {
      const seq = Math.floor((minOfDay - genStart) / skOffset);
      const skFare = shinkansenFare(day, minOfDay, seq);
      const skCap = trainCapacity('shinkansen', `sk-${day}-${minOfDay}`);
      pushShinkansenBurst(events, minOfDay, `SK-${minOfDay}`, skFare, skCap, false);
    }
  }

  return events;
}

function synthesizeArrivalEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): ArrivalEvent[] {
  const regular = generateArrivalEvents(day, genStart, genEnd);
  const airport = generateAirportTrainEvents(day, genStart, genEnd);
  const extra = generateExtraTrainEvents(day, genStart, genEnd);
  return [...regular, ...airport, ...extra];
}

function emptyAggregates(
  exitIds: ExitId[],
  slotCount: number,
  exits: ExitDef[],
): Record<ExitId, MinuteAggregate[]> {
  const out = {} as Record<ExitId, MinuteAggregate[]>;
  for (const id of exitIds) {
    const base = exits.find((e) => e.id === id)?.defaultBase ?? JR_BASE_FARE;
    out[id] = Array.from({ length: slotCount }, () => ({
      maxFare: base,
      totalCapacity: 0,
      trainCount: 0,
    }));
  }
  return out;
}

function aggregateEvents(
  events: ArrivalEvent[],
  viewStart: number,
  viewEnd: number,
  exits: ExitDef[],
): Record<ExitId, MinuteAggregate[]> {
  const slotCount = viewEnd - viewStart + 1;
  const agg = emptyAggregates(
    exits.map((e) => e.id),
    slotCount,
    exits,
  );

  for (const ev of events) {
    if (ev.minute < viewStart || ev.minute > viewEnd) {
      continue;
    }
    const idx = ev.minute - viewStart;
    const slot = agg[ev.exitId][idx];
    slot.maxFare = Math.max(slot.maxFare, ev.fare);
    slot.totalCapacity += ev.capacity;
    slot.trainCount += 1;
  }

  return agg;
}

function buildTotalCapacitySeries(
  agg: Record<ExitId, MinuteAggregate[]>,
  exits: ExitDef[],
): number[] {
  const len = agg[exits[0].id].length;
  return Array.from({ length: len }, (_, i) =>
    exits.reduce((sum, e) => sum + agg[e.id][i].totalCapacity, 0),
  );
}

function buildTrainCountSeries(
  agg: Record<ExitId, MinuteAggregate[]>,
  exits: ExitDef[],
): number[] {
  const len = agg[exits[0].id].length;
  return Array.from({ length: len }, (_, i) =>
    exits.reduce((sum, e) => sum + agg[e.id][i].trainCount, 0),
  );
}

function buildStats(
  agg: Record<ExitId, MinuteAggregate[]>,
  viewStart: number,
  events: ArrivalEvent[],
): StationFareWaveformStats {
  let peakFare = JR_BASE_FARE;
  let peakFareExitName = EXITS[0].name;
  let peakTime = minuteToLabel(viewStart);

  for (const exit of EXITS) {
    agg[exit.id].forEach((slot, i) => {
      if (slot.maxFare > peakFare) {
        peakFare = slot.maxFare;
        peakFareExitName = exit.name;
        peakTime = minuteToLabel(viewStart + i);
      }
    });
  }

  const viewEnd = viewStart + agg[EXITS[0].id].length - 1;
  const arrivalEventCount = events.filter(
    (e) => e.minute >= viewStart && e.minute <= viewEnd,
  ).length;
  const extraTrainCount = events.filter(
    (e) => e.isExtra && e.minute >= viewStart && e.minute <= viewEnd,
  ).length;
  const naritaArrivalCount = events.filter(
    (e) =>
      e.airportOrigin === 'narita' &&
      e.minute >= viewStart &&
      e.minute <= viewEnd,
  ).length;
  const hanedaArrivalCount = events.filter(
    (e) =>
      e.airportOrigin === 'haneda' &&
      e.minute >= viewStart &&
      e.minute <= viewEnd,
  ).length;

  return {
    peakFare,
    peakFareExitName,
    peakTime,
    arrivalEventCount,
    extraTrainCount,
    naritaArrivalCount,
    hanedaArrivalCount,
  };
}

function buildAirportHighlights(
  events: ArrivalEvent[],
  viewStart: number,
  viewEnd: number,
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
        markerColor: EXIT_LINE_COLORS[e.exitId],
        shortLabel: AIRPORT_ORIGIN_SHORT_LABELS[origin],
        trainLabel: e.trainId,
        exitId: e.exitId,
        fare: e.fare,
      };
    })
    .sort((a, b) => a.minuteIndex - b.minuteIndex);
}

export function getTokyoStationFareWaveform(
  dayCategoryInput: string,
  timePresetInput: string = 'peak',
): StationFareWaveformData {
  const dayCategory = resolveDayCategory(dayCategoryInput);
  const timePreset = resolveTimePreset(timePresetInput);
  const preset = TIME_PRESETS[timePreset];
  const viewStart = preset.start;
  const viewEnd = preset.end;
  const genStart = viewStart - NIHONBASHI_RESCUE_LAG_MIN;
  const genEnd = viewEnd;

  const events = synthesizeArrivalEvents(dayCategory, genStart, genEnd);
  const agg = aggregateEvents(events, viewStart, viewEnd, EXITS);
  const slotCount = viewEnd - viewStart + 1;
  const timeLabels = Array.from({ length: slotCount }, (_, i) =>
    minuteToLabel(viewStart + i),
  );

  const exits: ExitFareWaveformSeries[] = EXITS.map((exit) => ({
    exitId: exit.id,
    exitName: exit.name,
    lines: exit.lines,
    color: exit.lineColor,
    fareByMinute: agg[exit.id].map((s) => s.maxFare),
    capacityByMinute: agg[exit.id].map((s) => s.totalCapacity),
    trainCountByMinute: agg[exit.id].map((s) => s.trainCount),
  }));

  return {
    stationId: 1,
    stationName: '東京駅',
    dayCategory,
    timePreset,
    slotCount,
    startTime: minuteToLabel(viewStart),
    endTime: minuteToLabel(viewEnd),
    timeLabels,
    exits,
    totalCapacityByMinute: buildTotalCapacitySeries(agg, EXITS),
    trainCountByMinute: buildTrainCountSeries(agg, EXITS),
    airportHighlights: buildAirportHighlights(events, viewStart, viewEnd),
    stats: buildStats(agg, viewStart, events),
  };
}

export function isFareWaveformStationSupported(stationId: number): boolean {
  return stationId === 1;
}

export function contrastCheckColor(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#141414' : '#FFFFFF';
}

export { EXITS as TOKYO_STATION_EXITS };
