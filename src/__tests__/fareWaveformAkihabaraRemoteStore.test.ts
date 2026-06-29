jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        fareWaveformAkihabaraJsonUrl: 'https://example.com/fare-waveform-akihabara.json',
      },
    },
  },
}));

import { getAkihabaraStationFareWaveform } from '@/data/akihabaraStationFareMock';
import {
  getAkihabaraFareWaveformFromStore,
  parseFareWaveformAkihabaraRemotePayload,
  refreshFareWaveformAkihabaraSchedule,
  resetFareWaveformAkihabaraStoreForTests,
} from '@/services/fareWaveformAkihabaraRemoteStore';
import { makeFareWaveformDatasetKey } from '@/types/fareWaveformRemote';

describe('fareWaveformAkihabaraRemoteStore', () => {
  beforeEach(() => {
    resetFareWaveformAkihabaraStoreForTests();
    global.fetch = jest.fn();
  });

  it('parses valid remote payload', () => {
    const sample = getAkihabaraStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(8, 'weekday', 'slot_1020');
    const parsed = parseFareWaveformAkihabaraRemotePayload({
      version: 1,
      generatedAt: '2026-06-25T00:00:00Z',
      stationId: 8,
      stationName: '秋葉原駅',
      supportedStationIds: [8],
      source: 'test',
      dataset: { [key]: sample },
    });

    expect(parsed?.[key]?.stationName).toBe('秋葉原駅');
    expect(parsed?.[key]?.exits).toHaveLength(3);
  });

  it('updates dataset from remote fetch', async () => {
    const sample = getAkihabaraStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(8, 'weekday', 'slot_1020');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 1,
        generatedAt: '2026-06-25T00:00:00Z',
        stationId: 8,
        stationName: '秋葉原駅',
        supportedStationIds: [8],
        source: 'remote-test',
        dataset: { [key]: sample },
      }),
    });

    const status = await refreshFareWaveformAkihabaraSchedule({ force: true });
    expect(status.source).toBe('remote');
    expect(getAkihabaraFareWaveformFromStore('weekday', 'slot_1020')?.stats.arrivalEventCount).toBe(
      sample.stats.arrivalEventCount,
    );
  });
});
