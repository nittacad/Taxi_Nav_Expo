/**
 * Shinagawa Station fare waveform mock
 */

import {
  DayCategory,
  resolveTimePreset,
} from '@/types/fareWaveform';
import {
  assembleStationFareWaveform,
  FareWaveformArrivalEvent,
  FareWaveformExitDef,
  hash01,
  hashInt,
  isWeekendLike,
  jrLocalFare,
  shinkansenFare,
  trainCapacity,
  resolveTimeRange,
} from '@/data/fareWaveformEngine';

const EXITS: FareWaveformExitDef[] = [
  {
    id: 'takanawa',
    name: '高輪口',
    lines: 'JR山手・京浜東北（高輪側・坂道アクセス）',
    lineColor: '#80C342',
    defaultBase: 310,
  },
  {
    id: 'konan',
    name: '港南口',
    lines: 'JR東海道・在来線（港南側・オフィス直結）',
    lineColor: '#F6821F',
    defaultBase: 310,
  },
  {
    id: 'shinkansen',
    name: '新幹線口',
    lines: '東海道新幹線（到着客50%）',
    lineColor: '#0071BC',
    defaultBase: 310,
  },
];

const SHINKANSEN_SPLIT = {
  shinkansen: 0.5,
  takanawa: 0.3,
  konan: 0.2,
} as const;

const LOCAL_LAG = {
  takanawa: 1,
  konan: 2,
} as const;

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
    trainId: 'EX-SG-NOZ',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 20,
    exitId: 'shinkansen',
    fare: 12800,
    capacity: 1323,
    shinkansenBurst: true,
  },
  {
    trainId: 'EX-SG-HOME',
    appliesTo: 'weekend_holiday',
    minute: 17 * 60 + 48,
    exitId: 'konan',
    fare: 2100,
    capacity: 1200,
  },
  {
    trainId: 'EX-SG-WK',
    appliesTo: 'weekday',
    minute: 18 * 60 + 10,
    exitId: 'takanawa',
    fare: 2800,
    capacity: 1100,
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
    exitId: 'shinkansen',
    fare,
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.shinkansen),
    trainId: `${trainId}-gate`,
    isExtra,
  });
  events.push({
    minute: minute + LOCAL_LAG.takanawa,
    exitId: 'takanawa',
    fare: Math.round(fare * 0.98),
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.takanawa),
    trainId: `${trainId}-takanawa`,
    isExtra,
  });
  events.push({
    minute: minute + LOCAL_LAG.konan,
    exitId: 'konan',
    fare: Math.round(fare * 0.95),
    capacity: Math.round(totalCapacity * SHINKANSEN_SPLIT.konan),
    trainId: `${trainId}-konan`,
    isExtra,
  });
}

function generateExtraTrainEvents(
  day: DayCategory,
  genStart: number,
  genEnd: number,
): FareWaveformArrivalEvent[] {
  const events: FareWaveformArrivalEvent[] = [];
  const maxMinute = genEnd + LOCAL_LAG.konan;

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
        exitId: 'takanawa',
        fare: jrLocalFare(day, m, 0),
        capacity: trainCapacity('jr_commuter', `sg-tw-${day}-${m}`),
        trainId: `JR-TW-${m}`,
      });
    }
    if ((m - genStart) % jrInterval === 1) {
      events.push({
        minute: m,
        exitId: 'konan',
        fare: jrLocalFare(day, m, 1),
        capacity: trainCapacity('jr_commuter', `sg-kn-${day}-${m}`),
        trainId: `JR-KN-${m}`,
      });
    }
    if (!weekend && hash01(`sg-rapid-${day}-${m}`) > 0.6) {
      events.push({
        minute: m,
        exitId: 'konan',
        fare: 900 + hashInt(`sg-tokaido-${day}-${m}`, 2200),
        capacity: trainCapacity('jr_rapid', `sg-tk-${day}-${m}`),
        trainId: `JR-TK-RAP-${m}`,
      });
    }
    if ((m - genStart) % 10 === 5) {
      events.push({
        minute: m,
        exitId: 'takanawa',
        fare: 1100 + hashInt(`sg-lim-${day}-${m}`, 2400),
        capacity: trainCapacity('jr_rapid', `sg-lim-${day}-${m}`),
        trainId: `JR-TW-LIM-${m}`,
      });
    }

    const skOffset = weekend ? 15 : 13;
    if ((m - genStart) % skOffset === 7) {
      const seq = Math.floor((m - genStart) / skOffset);
      pushShinkansenBurst(
        events,
        m,
        `SK-SG-${m}`,
        shinkansenFare(day, m, seq),
        trainCapacity('shinkansen', `sg-sk-${day}-${m}`),
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
    ...generateExtraTrainEvents(day, genStart, genEnd),
  ];
}

export function getShinagawaStationFareWaveform(
  dayCategoryInput: string,
  timePresetInput: string = 'peak',
) {
  const timePreset = resolveTimePreset(timePresetInput);
  const preset = resolveTimeRange(timePreset);
  const viewStart = preset.start;
  const viewEnd = preset.end;
  const genStart = viewStart - LOCAL_LAG.konan;
  const events = synthesizeArrivalEvents(
    dayCategoryInput === 'weekday' ? 'weekday' : 'weekend_holiday',
    genStart,
    viewEnd,
  );

  return assembleStationFareWaveform({
    stationId: 3,
    stationName: '品川駅',
    dayCategoryInput,
    timePresetInput,
    exits: EXITS,
    events,
    genLagMinutes: LOCAL_LAG.konan,
  });
}

export { EXITS as SHINAGAWA_STATION_EXITS };
