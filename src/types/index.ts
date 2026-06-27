/**
 * Type definitions for Taxi_Nav Expo
 * 駅需要予測・ナビゲーションシステムの型定義
 */

/**
 * 駅情報の基本型
 */
export interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

/**
 * 駅の需要予測データ
 */
export interface StationDemand {
  stationId: number;
  stationName: string;
  facilityType?: 'station' | 'hotel' | 'event' | 'parliament' | 'medical' | 'shareholder' | 'conference'; // 将来の拡張用カテゴリ
  predictedDemand: number; // 0-100 (%)
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: number; // Unix timestamp (ms)
  confidence: number; // 0-1
  trend: 'up' | 'down' | 'stable';
}

/**
 * API レスポンス型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * 需要予測 API のレスポンス（API_SPEC.md に完全準拠）
 */
export interface DemandApiResponse {
  id: string | number;
  name: string;
  type: 'station' | 'hotel' | 'other';
  lat: number;
  lng: number;
  demand_score: number;
  color?: 'red' | 'yellow' | 'blue' | 'green';
  color_code?: string;
  demand_level?: string;
  confidence?: number;
  trend?: string;
  last_updated?: string;
}

/**
 * 複数駅の需要データ取得レスポンス
 */
export interface MultiStationDemandResponse {
  stations: DemandApiResponse[];
  requestTime: number;
  responseTime: number;
}

// 動的ピンの状態管理用の型定義（Web版 `realtime_pin.dart` に完全準拠）
export enum CustomerState {
  none = '',
  present = '🙋', // 客あり（単独）
  group = '👫', // 複数人の客
  zombie = '🧟', // ゾンビ（酔っ払い客）
}

export enum FlowState {
  good = '🐇', // 良い
  normal = '', // 普通（表示なし）
  slow = '🐢', // 遅い
  stopped = '💤', // 止まり
}

export enum TaxiMark {
  none = 'none',
  full = 'full', // 🈵 → 🚕🈵（数字非表示）
  overflow = 'overflow', // ～ → 🚕🈵～（満車+しっぽ）
}

export interface TaxiStatus {
  count: number;
  mark: TaxiMark;
}

export interface RealtimePinData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  placeName?: string;
  recordedAt: number;
  taxi: TaxiStatus;
  customer: CustomerState;
  flow: FlowState;
}

/**
 * エラーハンドリング用のクラス
 */
export class ApiError extends Error {
  code: string;
  statusCode: number;
  timestamp: number;
  retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    retryable: boolean
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = Date.now();
    this.retryable = retryable;
  }
}

export interface VIPRegistrationResponse {
  status: string;
  vip_id: string;
  created_at: string;
}

/**
 * ネットワーク再試行設定
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * API クライアント の設定
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
  headers?: Record<string, string>;
}

/**
 * 状態管理: 需要データのローカル状態
 */
export interface DemandState {
  stations: Map<number, StationDemand>;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: number | null;
  isOnline: boolean;
}

/**
 * ユーザーの位置情報
 */
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type {
  DayCategory,
  ExitFareWaveformSeries,
  FareWaveformLayerVisibility,
  StationFareWaveformData,
  StationFareWaveformStats,
} from './fareWaveform';

export {
  createDefaultLayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  DAY_CATEGORY_LABELS,
  EXIT_ID_TO_LAYER_KEY,
  FARE_WAVEFORM_SUPPORTED_STATION_IDS,
} from './fareWaveform';
