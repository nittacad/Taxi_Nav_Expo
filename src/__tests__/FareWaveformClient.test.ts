import { FareWaveformClient } from '@/services/FareWaveformClient';

describe('FareWaveformClient', () => {
  let client: FareWaveformClient;

  beforeEach(() => {
    client = new FareWaveformClient();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetchStationFareWaveform: 東京駅の平日データを取得できる', async () => {
    const promise = client.fetchStationFareWaveform(1, 'weekday');
    jest.advanceTimersByTime(200);
    const result = await promise;

    expect(result.stationId).toBe(1);
    expect(result.stationName).toBe('東京駅');
    expect(result.dayCategory).toBe('weekday');
    expect(result.exits).toHaveLength(5);
    expect(result.stats.arrivalEventCount).toBeGreaterThan(0);
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
