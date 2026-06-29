import { FareWaveformClient } from '@/services/FareWaveformClient';
import { resetFareWaveformAkihabaraStoreForTests } from '@/services/fareWaveformAkihabaraRemoteStore';
import { resetFareWaveformTokyoStoreForTests } from '@/services/fareWaveformTokyoRemoteStore';
import { resetFareWaveformUenoStoreForTests } from '@/services/fareWaveformUenoRemoteStore';

describe('FareWaveformClient', () => {
  let client: FareWaveformClient;

  beforeEach(() => {
    client = new FareWaveformClient();
    resetFareWaveformTokyoStoreForTests();
    resetFareWaveformUenoStoreForTests();
    resetFareWaveformAkihabaraStoreForTests();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetchStationFareWaveform: 東京駅の平日データを取得できる', async () => {
    const promise = client.fetchStationFareWaveform(1, 'weekday');
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.stationId).toBe(1);
    expect(result.stationName).toBe('東京駅');
    expect(result.dayCategory).toBe('weekday');
    expect(result.exits).toHaveLength(5);
    expect(result.stats.arrivalEventCount).toBeGreaterThan(0);
  });

  it('fetchStationFareWaveform: 品川駅の平日データを取得できる', async () => {
    const promise = client.fetchStationFareWaveform(3, 'weekday');
    jest.advanceTimersByTime(200);
    const result = await promise;

    expect(result.stationId).toBe(3);
    expect(result.stationName).toBe('品川駅');
    expect(result.exits).toHaveLength(3);
  });

  it('fetchStationFareWaveform: 上野駅の平日データを取得できる', async () => {
    const promise = client.fetchStationFareWaveform(6, 'weekday');
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.stationId).toBe(6);
    expect(result.stationName).toBe('上野駅');
    expect(result.exits.some((e) => e.exitId === 'keisei-ueno')).toBe(true);
  });

  it('fetchStationFareWaveform: 秋葉原駅の平日データを取得できる', async () => {
    const promise = client.fetchStationFareWaveform(8, 'weekday');
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.stationId).toBe(8);
    expect(result.stationName).toBe('秋葉原駅');
    expect(result.exits).toHaveLength(3);
  });

  it('fetchStationFareWaveform: 未対応駅は ApiError を投げる', async () => {
    await expect(
      client.fetchStationFareWaveform(2, 'weekday'),
    ).rejects.toMatchObject({
      code: 'FARE_WAVEFORM_UNSUPPORTED',
      statusCode: 404,
    });
  });
});
