jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        fareWaveformTokyoJsonUrl: 'https://example.com/fare-waveform-tokyo.json',
      },
    },
  },
}));

import { getTokyoStationFareWaveform } from '@/data/tokyoStationFareMock';
import {
  getTokyoFareWaveformFromStore,
  parseFareWaveformTokyoRemotePayload,
  refreshFareWaveformTokyoSchedule,
  resetFareWaveformTokyoStoreForTests,
} from '@/services/fareWaveformTokyoRemoteStore';
import { makeFareWaveformDatasetKey } from '@/types/fareWaveformRemote';

describe('fareWaveformTokyoRemoteStore', () => {
  beforeEach(() => {
    resetFareWaveformTokyoStoreForTests();
    global.fetch = jest.fn();
  });

  it('parses valid remote payload', () => {
    const sample = getTokyoStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(1, 'weekday', 'slot_1020');
    const parsed = parseFareWaveformTokyoRemotePayload({
      version: 1,
      generatedAt: '2026-06-25T00:00:00Z',
      stationId: 1,
      stationName: '東京駅',
      supportedStationIds: [1],
      source: 'test',
      dataset: { [key]: sample },
    });

    expect(parsed?.[key]?.stationName).toBe('東京駅');
    expect(parsed?.[key]?.exits).toHaveLength(5);
  });

  it('rejects invalid version', () => {
    expect(
      parseFareWaveformTokyoRemotePayload({
        version: 99,
        stationId: 1,
        supportedStationIds: [1],
        dataset: {},
      }),
    ).toBeNull();
  });

  it('updates dataset from remote fetch', async () => {
    const sample = getTokyoStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(1, 'weekday', 'slot_1020');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 1,
        generatedAt: '2026-06-25T00:00:00Z',
        stationId: 1,
        stationName: '東京駅',
        supportedStationIds: [1],
        source: 'remote-test',
        dataset: { [key]: sample },
      }),
    });

    const status = await refreshFareWaveformTokyoSchedule({ force: true });
    expect(status.source).toBe('remote');
    expect(getTokyoFareWaveformFromStore('weekday', 'slot_1020')?.stats.arrivalEventCount).toBe(
      sample.stats.arrivalEventCount,
    );
  });
});
