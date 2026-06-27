import { DemandAPIClient } from '../services/DemandAPIClient';
import { ApiClientConfig, ApiError } from '../types';

// モック化の設定
global.fetch = jest.fn();

describe('DemandAPIClient', () => {
  let client: DemandAPIClient;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    client = new DemandAPIClient({
      retryConfig: { maxRetries: 0, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
    });
  });

  it('fetchStationDemand: 正常にデータが取得・変換されること', async () => {
    const mockResponse = {
      id: 'tokyo',
      name: '東京駅',
      type: 'station',
      lat: 35.681236,
      lng: 139.767125,
      demand_score: 0.85,
      demand_level: 'HIGH',
      color_code: '#FF4444',
      confidence: 0.9,
      trend: 'up',
      last_updated: '2026-06-21T12:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.fetchStationDemand(1);

    expect(result.stationId).toBe(1);
    expect(result.stationName).toBe('東京駅');
    expect(result.riskLevel).toBe('high');
    expect(result.trend).toBe('up');
  });

    it('fetchStationDemand: 不正なJSONが返された場合はエラーになること', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new SyntaxError('Invalid JSON'); },
      });
  
      try {
        await client.fetchStationDemand(1);
        fail('Expected error was not thrown');
      } catch(e: any) {
        expect(e.code).toBe('PARSE_ERROR');
      }
    });
  
    it('fetchStationDemand: タイムアウトエラーが正しくハンドリングされること', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);
  
      try {
        await client.fetchStationDemand(1);
        fail('Expected error was not thrown');
      } catch(e: any) {
        expect(e.code).toBe('TIMEOUT');
        expect(e.statusCode).toBe(408);
      }
    });
});