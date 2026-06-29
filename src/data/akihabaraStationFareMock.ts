/**
 * Akihabara Station fare waveform mock
 * 電気街口 / 昭和通口 / 中央改札（3出口・新幹線なし）
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
  metroFare,
  trainCapacity,
  resolveTimeRange,
} from '@/data/fareWaveformEngine';

const EXITS: FareWaveformExitDef[] = [
  {
    id: 'denki-gai',
    name: '電気街口',
    lines: 'JR山手・中央（電気街・最大トラフィック）',
    lineColor: '#80C342',
    defaultBase: 310,
  },
  {
    id: 'showa-dori',
    name: '昭和通口',
    lines: '東京メトロ日比谷線（昭和通側・荷物多め）',
    lineColor: '#B5B5AC',
    defaultBase: 200,
  },
  {
    id: 'sobu-central',
    name: '中央改札',
    lines: 'JR総武線・快速（中央改札・通勤・通過）',
    lineColor: '#FFD400',
    defaultBase: 310,
  },
];

const GEN_LAG = 1;

type ExtraTrainSpec = {
  trainId: string;
  appliesTo: DayCategory;
  minute: number;
  exitId: string;
  fare: number;
  capacity: number;
};

const EXTRA_TRAIN_SCHEDULE: ExtraTrainSpec[] = [
  {
    trainId: 'EX-AK-HOBBY',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 15,
    exitId: 'denki-gai',
    fare: 2400,
    capacity: 1400,
  },
  {
    trainId: 'EX-AK-EVENT',
    appliesTo: 'weekend_holiday',
    minute: 18 * 60 + 5,
    exitId: 'denki-gai',
    fare: 1900,
    capacity: 1300,
  },
  {
    trainId: 'EX-AK-SOBU',
    appliesTo: 'weekday',
    minute: 18 * 60 + 22,
    exitId: 'sobu-central',
    fare: 1600,
    capacity: 1200,
  },
  {
    trainId: 'EX-AK-HIBIYA',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 45,
    exitId: 'showa-dori',
    fare: 1200,
    capacity: 950,
  },
];

function generateExtraTrainEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): FareWaveformArrivalEvent[] {
  const events: FareWaveformArrivalEvent[] = [];

  for (const spec of EXTRA_TRAIN_SCHEDULE) {
    if (spec.appliesTo !== day || spec.minute < genStart || spec.minute > genEnd) {
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
  const yamanoteInterval = weekend ? 3 : 2;
  const sobuInterval = weekend ? 4 : 3;
  const hibiyaInterval = 4;

  for (let m = genStart; m <= genEnd; m++) {
    if ((m - genStart) % yamanoteInterval === 0) {
      events.push({
        minute: m,
        exitId: 'denki-gai',
        fare: jrLocalFare(day, m, 0),
        capacity: trainCapacity('jr_commuter', `ak-dg-${day}-${m}`),
        trainId: `JR-DG-${m}`,
      });
    }
    if ((m - genStart) % sobuInterval === 1) {
      events.push({
        minute: m,
        exitId: 'sobu-central',
        fare: jrLocalFare(day, m, 1),
        capacity: trainCapacity('jr_commuter', `ak-sc-${day}-${m}`),
        trainId: `JR-SC-${m}`,
      });
    }
    if ((m - genStart) % hibiyaInterval === 2) {
      events.push({
        minute: m,
        exitId: 'showa-dori',
        fare: metroFare(day, m, 2),
        capacity: trainCapacity('metro', `ak-sd-${day}-${m}`),
        trainId: `HB-SD-${m}`,
      });
    }
    if (!weekend && hash01(`ak-sobu-rapid-${day}-${m}`) > 0.55) {
      events.push({
        minute: m,
        exitId: 'sobu-central',
        fare: 700 + hashInt(`ak-sobu-fare-${day}-${m}`, 1800),
        capacity: trainCapacity('jr_rapid', `ak-sr-${day}-${m}`),
        trainId: `JR-SR-${m}`,
      });
    }
    if (weekend && (m - genStart) % 8 === 4) {
      events.push({
        minute: m,
        exitId: 'denki-gai',
        fare: 500 + hashInt(`ak-wk-dg-${day}-${m}`, 1200),
        capacity: trainCapacity('jr_commuter', `ak-wk-${day}-${m}`),
        trainId: `JR-WK-DG-${m}`,
      });
    }
    if ((m - genStart) % 12 === 6) {
      events.push({
        minute: m,
        exitId: 'showa-dori',
        fare: 900 + hashInt(`ak-hib-lim-${day}-${m}`, 1500),
        capacity: trainCapacity('metro', `ak-hl-${day}-${m}`),
        trainId: `HB-LIM-${m}`,
      });
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
    ...generateExtraTrainEvents(day, genStart, genEnd),
  ];
}

export function getAkihabaraStationFareWaveform(
  dayCategoryInput: string,
  timePresetInput: string = 'peak',
) {
  const timePreset = resolveTimePreset(timePresetInput);
  const preset = resolveTimeRange(timePreset);
  const viewStart = preset.start;
  const viewEnd = preset.end;
  const genStart = viewStart - GEN_LAG;
  const day: DayCategory =
    dayCategoryInput === 'weekday' ? 'weekday' : 'weekend_holiday';
  const events = synthesizeArrivalEvents(day, genStart, viewEnd);

  return assembleStationFareWaveform({
    stationId: 8,
    stationName: '秋葉原駅',
    dayCategoryInput,
    timePresetInput,
    exits: EXITS,
    events,
    genLagMinutes: GEN_LAG,
  });
}

export { EXITS as AKIHABARA_STATION_EXITS };
