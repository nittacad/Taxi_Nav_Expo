/**
 * 駅別運賃波形 JSON + 同梱 generated.ts を生成（共通）
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listTimePresetOptions } from '../src/data/fareWaveformEngine';
import {
  FARE_WAVEFORM_STATION_JSON_VERSION,
  makeFareWaveformDatasetKey,
  type FareWaveformStationRemotePayload,
} from '../src/types/fareWaveformRemote';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DAY_CATEGORIES = ['weekday', 'weekend_holiday'] as const;
const TIME_PRESETS = listTimePresetOptions().map((option) => option.id);

export interface ExportFareWaveformStationOptions {
  stationId: number;
  stationName: string;
  source: string;
  jsonFileName: string;
  generatedFileName: string;
  exportScriptName: string;
  generate: (dayCategory: string, timePreset: string) => FareWaveformStationRemotePayload['dataset'][string];
}

export function exportFareWaveformStation(options: ExportFareWaveformStationOptions): void {
  const jsonPath = join(root, 'data', options.jsonFileName);
  const generatedPath = join(root, 'src/data', options.generatedFileName);

  const payload: FareWaveformStationRemotePayload = {
    version: FARE_WAVEFORM_STATION_JSON_VERSION,
    generatedAt: new Date().toISOString(),
    stationId: options.stationId,
    stationName: options.stationName,
    supportedStationIds: [options.stationId],
    source: options.source,
    dataset: {},
  };

  for (const day of DAY_CATEGORIES) {
    for (const preset of TIME_PRESETS) {
      const key = makeFareWaveformDatasetKey(options.stationId, day, preset);
      payload.dataset[key] = options.generate(day, preset);
    }
  }

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const exportConstName =
    options.stationId === 1
      ? 'FARE_WAVEFORM_TOKYO_IMPORTED'
      : options.stationId === 6
        ? 'FARE_WAVEFORM_UENO_IMPORTED'
        : `FARE_WAVEFORM_STATION_${options.stationId}_IMPORTED`;

  const generated = `/**
 * AUTO-GENERATED — 手編集しない
 * 生成: ${options.exportScriptName}
 * 入力: data/${options.jsonFileName}
 * キー数: ${Object.keys(payload.dataset).length}
 * 生成日: ${payload.generatedAt.slice(0, 10)}
 */

import type { FareWaveformStationRemotePayload } from '@/types/fareWaveformRemote';

export const ${exportConstName}: FareWaveformStationRemotePayload = ${JSON.stringify(payload)} as FareWaveformStationRemotePayload;
`;

  writeFileSync(generatedPath, generated, 'utf8');

  const jsonKb = (JSON.stringify(payload).length / 1024).toFixed(0);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${generatedPath} (${jsonKb} KB payload)`);
}
