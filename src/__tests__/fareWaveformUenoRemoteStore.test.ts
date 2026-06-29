jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        fareWaveformUenoJsonUrl: 'https://example.com/fare-waveform-ueno.json',
      },
    },
  },
}));

import { getUenoStationFareWaveform } from '@/data/uenoStationFareMock';
import {
  getUenoFareWaveformFromStore,
  parseFareWaveformUenoRemotePayload,
  refreshFareWaveformUenoSchedule,
  resetFareWaveformUenoStoreForTests,
} from '@/services/fareWaveformUenoRemoteStore';
import { makeFareWaveformDatasetKey } from '@/types/fareWaveformRemote';

describe('fareWaveformUenoRemoteStore', () => {
  beforeEach(() => {
    resetFareWaveformUenoStoreForTests();
    global.fetch = jest.fn();
  });

  it('parses valid remote payload', () => {
    const sample = getUenoStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(6, 'weekday', 'slot_1020');
    const parsed = parseFareWaveformUenoRemotePayload({
      version: 1,
      generatedAt: '2026-06-25T00:00:00Z',
      stationId: 6,
      stationName: '上野駅',
      supportedStationIds: [6],
      source: 'test',
      dataset: { [key]: sample },
    });

    expect(parsed?.[key]?.stationName).toBe('上野駅');
    expect(parsed?.[key]?.exits.some((exit) => exit.exitId === 'keisei-ueno')).toBe(true);
  });

  it('rejects invalid version', () => {
    expect(
      parseFareWaveformUenoRemotePayload({
        version: 99,
        stationId: 6,
        supportedStationIds: [6],
        dataset: {},
      }),
    ).toBeNull();
  });

  it('updates dataset from remote fetch', async () => {
    const sample = getUenoStationFareWaveform('weekday', 'slot_1020');
    const key = makeFareWaveformDatasetKey(6, 'weekday', 'slot_1020');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        version: 1,
        generatedAt: '2026-06-25T00:00:00Z',
        stationId: 6,
        stationName: '上野駅',
        supportedStationIds: [6],
        source: 'remote-test',
        dataset: { [key]: sample },
      }),
    });

    const status = await refreshFareWaveformUenoSchedule({ force: true });
    expect(status.source).toBe('remote');
    expect(getUenoFareWaveformFromStore('weekday', 'slot_1020')?.stats.arrivalEventCount).toBe(
      sample.stats.arrivalEventCount,
    );
  });
});
