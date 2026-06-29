/**
 * 秋葉原駅運賃波形 JSON + 同梱 generated.ts を生成
 *
 * 用法: npm run export:akihabara-fare-waveform
 */
import { getAkihabaraStationFareWaveform } from '../src/data/akihabaraStationFareMock';
import { exportFareWaveformStation } from './export-fare-waveform-station';
import { FARE_WAVEFORM_AKIHABARA_STATION_ID } from '../src/types/fareWaveformRemote';

exportFareWaveformStation({
  stationId: FARE_WAVEFORM_AKIHABARA_STATION_ID,
  stationName: '秋葉原駅',
  source: 'akihabaraStationFareMock',
  jsonFileName: 'fare-waveform-akihabara.json',
  generatedFileName: 'fareWaveformAkihabara.generated.ts',
  exportScriptName: 'npm run export:akihabara-fare-waveform',
  generate: getAkihabaraStationFareWaveform,
});
