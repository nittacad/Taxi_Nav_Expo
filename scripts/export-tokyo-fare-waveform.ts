/**
 * 東京駅運賃波形 JSON + 同梱 generated.ts を生成
 *
 * 用法: npm run export:tokyo-fare-waveform
 */
import { getTokyoStationFareWaveform } from '../src/data/tokyoStationFareMock';
import { exportFareWaveformStation } from './export-fare-waveform-station';
import { FARE_WAVEFORM_TOKYO_STATION_ID } from '../src/types/fareWaveformRemote';

exportFareWaveformStation({
  stationId: FARE_WAVEFORM_TOKYO_STATION_ID,
  stationName: '東京駅',
  source: 'tokyoStationFareMock',
  jsonFileName: 'fare-waveform-tokyo.json',
  generatedFileName: 'fareWaveformTokyo.generated.ts',
  exportScriptName: 'npm run export:tokyo-fare-waveform',
  generate: getTokyoStationFareWaveform,
});
