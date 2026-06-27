/**
 * 運賃波形オフライン HTML を生成（モックデータを埋め込み・ネットワーク不要）
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listTimePresetOptions } from '../src/data/fareWaveformEngine';
import { getStationFareWaveform } from '../src/data/fareWaveformRegistry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const STATIONS = [
  { id: 1, name: '東京駅' },
  { id: 3, name: '品川駅' },
  { id: 6, name: '上野駅' },
] as const;

const DAY_CATEGORIES = ['weekday', 'weekend_holiday'] as const;
const TIME_PRESETS = listTimePresetOptions().map((option) => option.id);

type Dataset = Record<string, ReturnType<typeof getStationFareWaveform>>;

const dataset: Dataset = {};

for (const station of STATIONS) {
  for (const day of DAY_CATEGORIES) {
    for (const preset of TIME_PRESETS) {
      const key = `${station.id}:${day}:${preset}`;
      dataset[key] = getStationFareWaveform(station.id, day, preset);
    }
  }
}

const meta = {
  generatedAt: new Date().toISOString(),
  stations: STATIONS,
  dayLabels: {
    weekday: '平日',
    weekend_holiday: '土日祝',
  },
  presetOptions: listTimePresetOptions(),
};

const templatePath = join(root, 'offline', 'fare-waveform.template.html');
const outputPath = join(root, 'offline', 'fare-waveform.html');

const template = readFileSync(templatePath, 'utf8');
const payload = JSON.stringify({ meta, dataset });
const html = template.replace('__WAVEFORM_PAYLOAD__', payload);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html, 'utf8');

console.log(`Wrote ${outputPath} (${(html.length / 1024).toFixed(0)} KB)`);
