/**
 * 東京駅運賃波形 JSON + 同梱 generated.ts を生成
 *
 * 用法: npm run export:tokyo-fare-waveform
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listTimePresetOptions } from '../src/data/fareWaveformEngine';
import { getTokyoStationFareWaveform } from '../src/data/tokyoStationFareMock';
import {
  FARE_WAVEFORM_TOKYO_JSON_VERSION,
  FARE_WAVEFORM_TOKYO_STATION_ID,
  makeFareWaveformDatasetKey,
  type FareWaveformTokyoRemotePayload,
} from '../src/types/fareWaveformRemote';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const JSON_PATH = join(root, 'data/fare-waveform-tokyo.json');
const GENERATED_PATH = join(root, 'src/data/fareWaveformTokyo.generated.ts');

const DAY_CATEGORIES = ['weekday', 'weekend_holiday'] as const;
const TIME_PRESETS = listTimePresetOptions().map((option) => option.id);

const payload: FareWaveformTokyoRemotePayload = {
  version: FARE_WAVEFORM_TOKYO_JSON_VERSION,
  generatedAt: new Date().toISOString(),
  stationId: FARE_WAVEFORM_TOKYO_STATION_ID,
  stationName: '東京駅',
  supportedStationIds: [FARE_WAVEFORM_TOKYO_STATION_ID],
  source: 'tokyoStationFareMock',
  dataset: {},
};

for (const day of DAY_CATEGORIES) {
  for (const preset of TIME_PRESETS) {
    const key = makeFareWaveformDatasetKey(FARE_WAVEFORM_TOKYO_STATION_ID, day, preset);
    payload.dataset[key] = getTokyoStationFareWaveform(day, preset);
  }
}

mkdirSync(dirname(JSON_PATH), { recursive: true });
writeFileSync(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const generated = `/**
 * AUTO-GENERATED — 手編集しない
 * 生成: npm run export:tokyo-fare-waveform
 * 入力: data/fare-waveform-tokyo.json
 * キー数: ${Object.keys(payload.dataset).length}
 * 生成日: ${payload.generatedAt.slice(0, 10)}
 */

import type { FareWaveformTokyoRemotePayload } from '@/types/fareWaveformRemote';

export const FARE_WAVEFORM_TOKYO_IMPORTED: FareWaveformTokyoRemotePayload = ${JSON.stringify(payload)} as FareWaveformTokyoRemotePayload;
`;

writeFileSync(GENERATED_PATH, generated, 'utf8');

const jsonKb = (JSON.stringify(payload).length / 1024).toFixed(0);
console.log(`Wrote ${JSON_PATH}`);
console.log(`Wrote ${GENERATED_PATH} (${jsonKb} KB payload)`);
