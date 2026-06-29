/**
 * 上野駅運賃波形 JSON + 同梱 generated.ts を生成
 *
 * 用法: npm run export:ueno-fare-waveform
 */
import { getUenoStationFareWaveform } from '../src/data/uenoStationFareMock';
import { exportFareWaveformStation } from './export-fare-waveform-station';
import { FARE_WAVEFORM_UENO_STATION_ID } from '../src/types/fareWaveformRemote';

exportFareWaveformStation({
  stationId: FARE_WAVEFORM_UENO_STATION_ID,
  stationName: '上野駅',
  source: 'uenoStationFareMock',
  jsonFileName: 'fare-waveform-ueno.json',
  generatedFileName: 'fareWaveformUeno.generated.ts',
  exportScriptName: 'npm run export:ueno-fare-waveform',
  generate: getUenoStationFareWaveform,
});
