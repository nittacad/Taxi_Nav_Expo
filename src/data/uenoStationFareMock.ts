/**
 * Ueno Station fare waveform mock
 * JR上野と京成上野は物理的に離れているため出口を分離
 */

import { DayCategory, resolveTimePreset } from '@/types/fareWaveform';
import {
  assembleStationFareWaveform,
  FareWaveformArrivalEvent,
  FareWaveformExitDef,
  hash01,
  hashInt,
  isWeekendLike,
  jrLocalFare,
  keiseiFare,
  shinkansenFare,
  trainCapacity,
  resolveTimeRange,
} from '@/data/fareWaveformEngine';

const EXITS: FareWaveformExitDef[] = [
  {
    id: 'jr-ueno',
    name: 'JR上野',
    lines: 'JR山手・常磐・高崎 / 東京メトロ（正面口側）',
    lineColor: '#80C342',
    defaultBase: 310,
  },
  {
    id: 'keisei-ueno',
    name: '京成上野',
    lines: '京成本線・スカイライナー・スカイアクセス（成田方面）',
    lineColor: '#005AAA',
    defaultBase: 260,
  },
  {
    id: 'jr-shinkansen',
    name: '新幹線改札',
    lines: '東北・北陸・上越新幹線（JR上野側）',
    lineColor: '#0071BC',
    defaultBase: 310,
  },
];

const SHINKANSEN_SPLIT = {
  shinkansen: 0.45,
  jrUeno: 0.55,
} as const;

const JR_UENO_LAG = 1;

type KeiseiNaritaTemplate = {
  lineKey: 'keiseiSkyliner' | 'keiseiSkyAccess';
  trainLabel: string;
  offsetMod: number;
  offsetRemainder: number;
  fare: number;
  capacity: number;
  weekendSkip?: boolean;
};

const KEISEI_NARITA_TEMPLATES: KeiseiNaritaTemplate[] = [
  {
    lineKey: 'keiseiSkyliner',
    trainLabel: 'スカイライナー',
    offsetMod: 24,
    offsetRemainder: 4,
    fare: 2670,
    capacity: 700,
  },
  {
    lineKey: 'keiseiSkyAccess',
    trainLabel: 'スカイアクセス',
    offsetMod: 18,
    offsetRemainder: 8,
    fare: 1320,
    capacity: 900,
  },
  {
    lineKey: 'keiseiSkyliner',
    trainLabel: 'スカイライナー（快速）',
    offsetMod: 24,
    offsetRemainder: 16,
    fare: 2570,
    capacity: 700,
    weekendSkip: true,
  },
];

type ExtraTrainSpec = {
  trainId: string;
  appliesTo: DayCategory;
  minute: number;
  exitId: string;
  fare: number;
  capacity: number;
  shinkansenBurst?: boolean;
};

const EXTRA_TRAIN_SCHEDULE: ExtraTrainSpec[] = [
  {
    trainId: 'EX-UE-NOZ',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 35,
    exitId: 'jr-shinkansen',
    fare: 13500,
    capacity: 1323,
    shinkansenBurst: true,
  },
  {
    trainId: 'EX-KEISEI-EXP',
    appliesTo: 'weekend_holiday',
    minute: 18 * 60 + 5,
    exitId: 'keisei-ueno',
    fare: 2900,
    capacity: 750,
  },
  {
    trainId: 'EX-JR-HOME',
    appliesTo: 'weekday',
    minute: 18 * 60 + 20,
    exitId: 'jr-ueno',
    fare: 2400,
    capacity: 1300,
  },
];

function pushShinkansenBurst(
  events: FareWaveformArrivalEvent[],
  minute: number,
  trainId: string,
  fare: number,
  totalCapacity: number,
  isExtra: boolean,
): void {
  events.push({
    minute,
    exitId: 'jr-shinkansen',
    fare,
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.shinkansen),
    trainId: `${trainId}-gate`,
    isExtra,
  });
  events.push({
    minute: minute + JR_UENO_LAG,
    exitId: 'jr-ueno',
    fare: Math.round(fare * 0.97),
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.jrUeno),
    trainId: `${trainId}-jr`,
    isExtra,
  });
}

function generateKeiseiNaritaEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): FareWaveformArrivalEvent[] {
  const events: FareWaveformArrivalEvent[] = [];
  const weekend = isWeekendLike(day);

  for (let m = genStart; m <= genEnd; m++) {
    for (const template of KEISEI_NARITA_TEMPLATES) {
      if (weekend && template.weekendSkip) {
        continue;
      }
      if ((m - genStart) % template.offsetMod !== template.offsetRemainder) {
        continue;
      }
      events.push({
        minute: m,
        exitId: 'keisei-ueno',
        fare: template.fare + hashInt(`keisei-${day}-${m}`, 80),
        capacity: template.capacity,
        trainId: `${template.trainLabel}-${m}`,
        airportOrigin: 'narita',
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
): FareWaveformArrivalEvent[] {
  const events: FareWaveformArrivalEvent[] = [];
  const maxMinute = genEnd + JR_UENO_LAG;

  for (const spec of EXTRA_TRAIN_SCHEDULE) {
    if (spec.appliesTo !== day || spec.minute < genStart || spec.minute > maxMinute) {
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
): FareWaveformArrivalEvent[] {
  const events: FareWaveformArrivalEvent[] = [];
  const weekend = isWeekendLike(day);
  const jrInterval = weekend ? 3 : 2;

  for (let m = genStart; m <= genEnd; m++) {
    if ((m - genStart) % jrInterval === 0) {
      events.push({
        minute: m,
        exitId: 'jr-ueno',
        fare: jrLocalFare(day, m, 0),
        capacity: trainCapacity('jr_commuter', `ue-jr-${day}-${m}`),
        trainId: `JR-UE-${m}`,
      });
    }
    if (!weekend && hash01(`ue-jr-x-${day}-${m}`) > 0.55) {
      events.push({
        minute: m,
        exitId: 'jr-ueno',
        fare: jrLocalFare(day, m, 1),
        capacity: trainCapacity('jr_rapid', `ue-jr-r-${day}-${m}`),
        trainId: `JR-UE-RAP-${m}`,
      });
    }
    if ((m - genStart) % 4 === 2) {
      events.push({
        minute: m,
        exitId: 'keisei-ueno',
        fare: keiseiFare(day, m, 0),
        capacity: trainCapacity('keisei', `ue-ks-${day}-${m}`),
        trainId: `KS-UE-${m}`,
      });
    }
    if (hash01(`ue-ks-x-${day}-${m}`) > 0.82) {
      events.push({
        minute: m,
        exitId: 'keisei-ueno',
        fare: keiseiFare(day, m, 1),
        capacity: trainCapacity('keisei', `ue-ks2-${day}-${m}`),
        trainId: `KS-UE-X-${m}`,
      });
    }

    const skOffset = weekend ? 14 : 12;
    if ((m - genStart) % skOffset === 6) {
      const seq = Math.floor((m - genStart) / skOffset);
      pushShinkansenBurst(
        events,
        m,
        `SK-UE-${m}`,
        shinkansenFare(day, m, seq),
        trainCapacity('shinkansen', `ue-sk-${day}-${m}`),
        false,
      );
    }
  }

  return events;
}

function synthesizeArrivalEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): FareWaveformArrivalEvent[] {
  return [
    ...generateArrivalEvents(day, genStart, genEnd),
    ...generateKeiseiNaritaEvents(day, genStart, genEnd),
    ...generateExtraTrainEvents(day, genStart, genEnd),
  ];
}

export function getUenoStationFareWaveform(
  dayCategoryInput: string,
  timePresetInput: string = 'peak',
) {
  const timePreset = resolveTimePreset(timePresetInput);
  const preset = resolveTimeRange(timePreset);
  const viewStart = preset.start;
  const viewEnd = preset.end;
  const genStart = viewStart - JR_UENO_LAG;
  const day: DayCategory =
    dayCategoryInput === 'weekday' ? 'weekday' : 'weekend_holiday';
  const events = synthesizeArrivalEvents(day, genStart, viewEnd);

  return assembleStationFareWaveform({
    stationId: 6,
    stationName: '上野駅',
    dayCategoryInput,
    timePresetInput,
    exits: EXITS,
    events,
    genLagMinutes: JR_UENO_LAG,
  });
}

export { EXITS as UENO_STATION_EXITS };
