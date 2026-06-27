# Taxi_Nav API Specification (Mock for UI Development)
作成日: 2026年6月21日

## 概要
フロントエンド（Expo）とバックエンド（Python / FastAPI想定）間の連携API仕様。
Day 1-3のUI基盤班は、このドキュメントに記載されたモックレスポンスを使用して実装を進める。

## エンドポイント一覧

### 0. 共通エラーレスポンス
全てのエンドポイントでエラー発生時は以下の統一スキーマを返す。
```json
{
  "error_code": "AUTH_FAILED",
  "message": "認証に失敗しました",
  "detail": "メールアドレスまたはパスワードが正しくありません",
  "timestamp": "2026-06-21T12:00:00Z"
}
```

### 1. ログイン認証
- **URL**: `POST /api/v1/auth/login`
- **目的**: ドライバーの認証とトークン取得

#### リクエスト
```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

#### レスポンス (200 OK)
```json
{
  "token": "mock-jwt-token-12345",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "mock-refresh-token",
  "driver_id": "D-001",
  "name": "テストドライバー"
}
```

### 2. 需要予測データ取得

#### 2.1. 現在時刻の全拠点の需要スコアを取得
- **URL**: `GET /api/v1/demand/current`
- **目的**: 現在時刻の全拠点の需要スコアを取得

##### レスポンス (200 OK)
```json
{
  "timestamp": "2026-06-21T12:00:00Z",
  "data": [
    {
      "id": "tokyo",
      "name": "東京駅",
      "type": "station",
      "lat": 35.681236,
      "lng": 139.767125,
      "demand_score": 0.85,
      "demand_level": "HIGH",
      "color_code": "#FF4444"
    },
    {
      "id": "hotel_imperial",
      "name": "帝国ホテル",
      "type": "hotel",
      "lat": 35.6750,
      "lng": 139.7709,
      "demand_score": 0.45,
      "demand_level": "MEDIUM",
      "color_code": "#FFCC00"
    }
  ]
}
```

#### 2.2. 単一拠点の需要予測を取得
- **URL**: `GET /api/v1/demand/stations/{id}`
- **目的**: 特定の拠点（駅やホテル）の需要予測を取得

##### レスポンス (200 OK)
```json
{
  "id": "tokyo",
  "name": "東京駅",
  "type": "station",
  "lat": 35.681236,
  "lng": 139.767125,
  "demand_score": 0.85,
  "demand_level": "HIGH",
  "color_code": "#FF4444",
  "confidence": 0.92,
  "trend": "up",
  "last_updated": "2026-06-21T12:00:00Z"
}
```

#### 2.3. 複数拠点の需要予測を一括取得
- **URL**: `GET /api/v1/demand/stations/batch`
- **目的**: 複数拠点の需要予測を一括取得
- **クエリパラメータ**: `station_ids` (複数指定可、例: `?station_ids=1&station_ids=2`)

##### レスポンス (200 OK)
```json
{
  "stations": [
    {
      "id": "tokyo",
      "name": "東京駅",
      "type": "station",
      "lat": 35.681236,
      "lng": 139.767125,
      "demand_score": 0.85,
      "demand_level": "HIGH",
      "color_code": "#FF4444",
      "confidence": 0.92,
      "trend": "up",
      "last_updated": "2026-06-21T12:00:00Z"
    }
  ],
  "requestTime": 1718961600000,
  "responseTime": 1718961600800
}
```

#### 2.4. 地域範囲内の拠点需要を取得
- **URL**: `GET /api/v1/demand/stations/by-bounds`
- **目的**: 地図の表示範囲（矩形範囲）内の拠点需要を取得
- **クエリパラメータ**: `min_lat`, `max_lat`, `min_lng`, `max_lng`

##### レスポンス (200 OK)
```json
{
  "stations": [
    {
      "id": "tokyo",
      "name": "東京駅",
      "type": "station",
      "lat": 35.681236,
      "lng": 139.767125,
      "demand_score": 0.85,
      "demand_level": "HIGH",
      "color_code": "#FF4444",
      "confidence": 0.92,
      "trend": "up",
      "last_updated": "2026-06-21T12:00:00Z"
    }
  ],
  "requestTime": 1718961600000,
  "responseTime": 1718961600800
}
```

*注記*: 
- `demand_score` は 0.0〜1.0 に正規化された値。
- 座標は `facility_registry.py` を正とする。

### 3. VIP（太客）登録
- **URL**: `POST /api/v1/vip/register`
- **目的**: 太客の移動履歴の登録

#### リクエスト
```json
{
  "driver_id": "D-001",
  "pickup_lat": 35.681236,
  "pickup_lng": 139.767125,
  "dropoff_lat": 35.658034,
  "dropoff_lng": 139.701636,
  "time": "2026-06-21T13:00:00Z"
}
```

#### レスポンス (201 Created)
```json
{
  "status": "success",
  "vip_id": "VIP-001",
  "created_at": "2026-06-21T12:05:00Z"
}
```