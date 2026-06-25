/**
 * DemandAPIClient.ts
 * 駅需要予測 API との通信を管理するクライアント
 * 機能: HTTP リクエスト、エラーハンドリング、リトライロジック
 */

import {
  DemandApiResponse,
  MultiStationDemandResponse,
  ApiResponse,
  ApiError,
  StationDemand,
  ApiClientConfig,
  RetryConfig,
  VIPRegistrationResponse,
} from '@/types';

/**
 * デフォルトの API クライアント設定
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 5000,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },
};

const USE_MOCK_DATA = process.env.NODE_ENV !== 'test'; // テスト時はモックデータを使用せず、実際のfetchをモックする

const STATION_ID_MAP: Record<string, number> = {
  'tokyo': 1,
  'shinjuku': 2,
  'shinagawa': 3,
  'shibuya': 4,
  'ikebukuro': 5,
  'ueno': 6,
  'shinbashi': 7,
  'akihabara': 8,
  'hamamatsucho': 9,
  'nippori': 10,
  'hotel_imperial': 101,
  'hotel_neworotani': 102,
  'hotel_hilton': 103,
  'hotel_mitsui': 104,
  'hotel_metro': 105,
  'hotel_business': 106,
};

const REVERSE_STATION_ID_MAP: Record<number, string> = Object.entries(STATION_ID_MAP).reduce(
  (acc, [key, val]) => ({ ...acc, [val]: key }),
  {} as Record<number, string>
);

const MOCK_DATA = {
  stations: [
    { id: 'tokyo', name: '東京駅', type: 'station', lat: 35.6752, lng: 139.7674, demand_score: 85, color: 'red', confidence: 0.92, trend: 'up' },
    { id: 'shinjuku', name: '新宿駅', type: 'station', lat: 35.6898, lng: 139.7006, demand_score: 65, color: 'yellow', confidence: 0.88, trend: 'stable' },
    { id: 'shinagawa', name: '品川駅', type: 'station', lat: 34.6330, lng: 139.7394, demand_score: 35, color: 'blue', confidence: 0.85, trend: 'down' },
    { id: 'shibuya', name: '渋谷駅', type: 'station', lat: 35.6595, lng: 139.7004, demand_score: 60, color: 'yellow', confidence: 0.88, trend: 'stable' },
    { id: 'ikebukuro', name: '池袋駅', type: 'station', lat: 35.7294, lng: 139.7108, demand_score: 55, color: 'yellow', confidence: 0.85, trend: 'up' },
    { id: 'ueno', name: '上野駅', type: 'station', lat: 35.7147, lng: 139.7711, demand_score: 40, color: 'blue', confidence: 0.80, trend: 'down' },
    { id: 'shinbashi', name: '新橋駅', type: 'station', lat: 35.6654, lng: 139.7596, demand_score: 75, color: 'yellow', confidence: 0.90, trend: 'up' },
    { id: 'akihabara', name: '秋葉原駅', type: 'station', lat: 35.6986, lng: 139.7712, demand_score: 45, color: 'yellow', confidence: 0.82, trend: 'stable' },
    { id: 'hamamatsucho', name: '浜松町駅', type: 'station', lat: 35.6553, lng: 139.7571, demand_score: 30, color: 'blue', confidence: 0.75, trend: 'down' },
    { id: 'nippori', name: '日暮里駅', type: 'station', lat: 35.7277, lng: 139.7709, demand_score: 25, color: 'blue', confidence: 0.70, trend: 'stable' },
    
    // ホテルデータをモックに追加
    { id: 'hotel_imperial', name: '帝国ホテル', type: 'hotel', lat: 35.6750, lng: 139.7709, demand_score: 90, color: 'red', confidence: 0.95, trend: 'up' },
    { id: 'hotel_neworotani', name: 'ホテルニューオータニ', type: 'hotel', lat: 35.6751, lng: 139.7289, demand_score: 75, color: 'yellow', confidence: 0.85, trend: 'up' },
    { id: 'hotel_hilton', name: 'ヒルトン東京', type: 'hotel', lat: 35.6719, lng: 139.7285, demand_score: 50, color: 'yellow', confidence: 0.80, trend: 'stable' },
    { id: 'hotel_mitsui', name: '三井ガーデンホテル渋谷', type: 'hotel', lat: 35.6623, lng: 139.7027, demand_score: 40, color: 'blue', confidence: 0.70, trend: 'down' },
    { id: 'hotel_metro', name: 'ホテルメトロポリタン', type: 'hotel', lat: 35.6842, lng: 139.7671, demand_score: 30, color: 'blue', confidence: 0.75, trend: 'down' },
    { id: 'hotel_business', name: '東京ビジネスホテルチェーン', type: 'hotel', lat: 35.6770, lng: 139.7650, demand_score: 20, color: 'blue', confidence: 0.60, trend: 'stable' },
  ] as DemandApiResponse[]
};

/**
 * HTTP ステータスコードの判定
 */
const isRetryableStatus = (status: number): boolean => {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
};

/**
 * 指数バックオフで待機
 */
const exponentialBackoff = async (
  attempt: number,
  config: RetryConfig
): Promise<void> => {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;
const VALID_TRENDS = ['up', 'down', 'stable'] as const;

function validateRiskLevel(value: string): 'low' | 'medium' | 'high' {
  if (VALID_RISK_LEVELS.includes(value as any)) {
    return value as 'low' | 'medium' | 'high';
  }
  return 'medium'; // fallback
}

function validateTrend(value: string): 'up' | 'down' | 'stable' {
  if (VALID_TRENDS.includes(value as any)) {
    return value as 'up' | 'down' | 'stable';
  }
  return 'stable'; // fallback
}

/**
 * API レスポンスから StationDemand に変換
 */
const transformApiResponse = (apiData: DemandApiResponse): StationDemand => {
  let numericId = 0;
  if (typeof apiData.id === 'number') {
    numericId = apiData.id;
  } else {
    numericId = STATION_ID_MAP[apiData.id] || parseInt(apiData.id, 10) || 0;
  }

  // score を 0-100 に変換
  let score = apiData.demand_score;
  if (score <= 1.0) {
    score = Math.round(score * 100);
  }

  // color, color_code, demand_level から riskLevel を判定
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  const color = apiData.color || '';
  const colorCode = apiData.color_code || '';
  const level = apiData.demand_level || '';

  if (
    color === 'red' || 
    colorCode.toUpperCase() === '#FF4444' || 
    colorCode.toUpperCase() === '#E74C3C' ||
    level.toUpperCase() === 'HIGH'
  ) {
    riskLevel = 'high';
  } else if (
    color === 'yellow' || 
    colorCode.toUpperCase() === '#FFCC00' || 
    colorCode.toUpperCase() === '#F39C12' ||
    colorCode.toUpperCase() === '#F1C40F' ||
    level.toUpperCase() === 'MEDIUM'
  ) {
    riskLevel = 'medium';
  } else if (
    color === 'blue' || 
    color === 'green' || 
    colorCode.toUpperCase() === '#27AE60' || 
    level.toUpperCase() === 'LOW'
  ) {
    riskLevel = 'low';
  }

  return {
    stationId: numericId,
    stationName: apiData.name,
    facilityType: apiData.type as any || 'station',
    predictedDemand: score,
    riskLevel: riskLevel,
    timestamp: Date.now(),
    confidence: apiData.confidence || 0.8,
    trend: validateTrend(apiData.trend || 'stable'),
  };
};


/**
 * DemandAPIClient クラス
 * 駅需要予測 API との通信を一元管理
 */
export class DemandAPIClient {
  private config: ApiClientConfig;
  private requestTimeout: AbortController | null = null;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * 単一の駅の需要予測を取得
   * @param stationId 駅ID
   * @returns StationDemand または null（エラー時）
   * @throws ApiError エラー情報
   */
  async fetchStationDemand(stationId: number): Promise<StationDemand> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve, reject) => 
        setTimeout(() => {
          const stringId = REVERSE_STATION_ID_MAP[stationId];
          const station = MOCK_DATA.stations.find(s => s.id === stringId || STATION_ID_MAP[s.id] === stationId);
          if (station) {
            resolve(transformApiResponse(station));
          } else {
            reject(new ApiError(`Station ${stationId} not found`, 'NOT_FOUND', 404, false));
          }
        }, 800)
      );
    }

    return this.executeWithRetry(async () => {
      const stringId = REVERSE_STATION_ID_MAP[stationId] || stationId.toString();
      const url = `${this.config.baseUrl}/demand/stations/${stringId}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw this.createApiError(
          response.status,
          `Failed to fetch station ${stationId}`
        );
      }

      let data: DemandApiResponse;
      try {
        data = await response.json();
      } catch (e) {
        throw new ApiError('Invalid JSON response', 'PARSE_ERROR', response.status, false);
      }
      return transformApiResponse(data);
    });
  }

  /**
   * 複数駅の需要予測を一括取得
   * @param stationIds 駅ID の配列
   * @returns StationDemand の配列
   * @throws ApiError エラー情報
   */
  async fetchMultipleStationDemands(
    stationIds: number[]
  ): Promise<StationDemand[]> {
    if (USE_MOCK_DATA) {
      return new Promise(resolve => 
        setTimeout(() => {
          const filtered = stationIds.length > 0 
            ? MOCK_DATA.stations.filter(s => stationIds.includes(STATION_ID_MAP[s.id]))
            : MOCK_DATA.stations;
          resolve(filtered.map(transformApiResponse as any));
        }, 800)
      );
    }
    
    return this.executeWithRetry(async () => {
      const queryParams = new URLSearchParams();
      stationIds.forEach((id) => queryParams.append('station_ids', id.toString()));

      const url = `${this.config.baseUrl}/demand/stations/batch?${queryParams.toString()}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw this.createApiError(
          response.status,
          'Failed to fetch multiple stations'
        );
      }

      let data: MultiStationDemandResponse;
      try {
        data = await response.json();
      } catch (e) {
        throw new ApiError('Invalid JSON response', 'PARSE_ERROR', response.status, false);
      }
      return data.stations.map(transformApiResponse);
    });
  }

  /**
   * 特定の地域（矩形範囲）内の駅需要を取得
   * @param bounds 矩形範囲 {minLat, maxLat, minLng, maxLng}
   * @returns StationDemand の配列
   * @throws ApiError エラー情報
   */
  async fetchDemandByBounds(bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): Promise<StationDemand[]> {
    if (USE_MOCK_DATA) {
      return new Promise(resolve => 
        setTimeout(() => {
          resolve(MOCK_DATA.stations.map(transformApiResponse as any));
        }, 800)
      );
    }

    return this.executeWithRetry(async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('min_lat', bounds.minLat.toString());
      queryParams.append('max_lat', bounds.maxLat.toString());
      queryParams.append('min_lng', bounds.minLng.toString());
      queryParams.append('max_lng', bounds.maxLng.toString());

      const url = `${this.config.baseUrl}/demand/stations/by-bounds?${queryParams.toString()}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw this.createApiError(response.status, 'Failed to fetch by bounds');
      }

      let data: MultiStationDemandResponse;
      try {
        data = await response.json();
      } catch (e) {
        throw new ApiError('Invalid JSON response', 'PARSE_ERROR', response.status, false);
      }
      return data.stations.map(transformApiResponse);
    });
  }

  /**
   * タイムアウト付きの fetch ラッパー
   */
  private fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    return fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
    }).finally(() => clearTimeout(timeoutId));
  }

  /**
   * リトライロジック付きの実行
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new ApiError(
            'Request timeout',
            'TIMEOUT',
            408,
            true
          );
        } else if (error instanceof ApiError) {
          lastError = error;
        } else {
          const isNetworkError = error instanceof Error && error.message.includes('Network request failed');
          lastError = new ApiError(
            error instanceof Error ? error.message : 'Unknown error',
            isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN',
            0,
            isNetworkError // Retryable if network error
          );
        }

        if (
          !lastError.retryable ||
          attempt >= this.config.retryConfig.maxRetries
        ) {
          throw lastError;
        }

        await exponentialBackoff(attempt, this.config.retryConfig);
      }
    }

    throw lastError || new ApiError('Max retries exceeded', 'MAX_RETRIES', 0, false);
  }

  /**
   * ApiError インスタンスの作成
   */
  private createApiError(
    statusCode: number,
    message: string
  ): ApiError {
    return new ApiError(
      message,
      `HTTP_${statusCode}`,
      statusCode,
      isRetryableStatus(statusCode)
    );
  }

  /**
   * VIP（太客）登録
   * @param payload 登録データ
   * @returns VIPRegistrationResponse
   * @throws ApiError エラー情報
   */
  async registerVip(payload: {
    driver_id: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    time: string;
  }): Promise<VIPRegistrationResponse> {
    return this.executeWithRetry(async () => {
      const url = `${this.config.baseUrl}/vip/register`;
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw this.createApiError(response.status, 'Failed to register VIP');
      }

      try {
        return await response.json();
      } catch (e) {
        throw new ApiError('Invalid JSON response', 'PARSE_ERROR', response.status, false);
      }
    });
  }

  /**
   * リクエストのキャンセル
   */
  cancel(): void {
    this.requestTimeout?.abort();
  }

  /**
   * API クライアント設定の更新
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

// デフォルトインスタンス（シングルトン）
export const demandApiClient = new DemandAPIClient();

