# React Native コード v1.0 - 駅需要予測機能

## 📋 概要

このプロジェクトは、Taxi_Nav の**駅需要予測機能**を React Native（Expo）で実装したものです。

**主な特徴**:
- ✅ TypeScript 100% 型安全
- ✅ テストカバレッジ 80%+（Jest）
- ✅ エラーハンドリング完全実装
- ✅ リトライロジック（指数バックオフ）
- ✅ 状態管理（React Context + useReducer）
- ✅ React Native/Expo 最適化

---

## 🏗️ ファイル構成

```
src/
├── screens/
│   └── StationDemandScreen.tsx          # 駅需要表示スクリーン
├── services/
│   └── DemandAPIClient.ts               # API クライアント
├── state/
│   └── demandStore.ts                   # 状態管理（Context + Reducer）
├── types/
│   └── index.ts                         # TypeScript 型定義
└── __tests__/
    ├── DemandAPIClient.test.ts          # API クライアント テスト
    ├── demandStore.test.ts              # 状態管理 テスト
    └── StationDemandScreen.test.tsx     # スクリーン テスト

config/
├── jest.config.js                       # Jest 設定
└── jest.setup.js                        # Jest セットアップ
```

---

## 🚀 セットアップ手順

### 1. 必要な環境

```bash
Node.js >= 18.0
npm >= 9.0 または yarn >= 4.0
TypeScript >= 6.0
React Native >= 0.85.3
Expo >= 56.0.12
```

### 2. 依存パッケージのインストール

```bash
cd Taxi_Nav_Expo
npm install

# テストランナーの追加
npm install --save-dev jest @testing-library/react-native @types/jest
```

### 3. 環境変数の設定

`.env` ファイルを作成:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. TypeScript コンパイル

```bash
npm run build
```

---

## 📝 主要ファイルの説明

### 1. **DemandAPIClient.ts** - API クライアント

駅需要予測 API との通信を管理します。

**主な機能**:
- `fetchStationDemand(stationId)` - 単一駅の需要を取得
- `fetchMultipleStationDemands(stationIds)` - 複数駅の需要を一括取得
- `fetchDemandByBounds(bounds)` - 矩形範囲内の駅需要を取得

**エラーハンドリング**:
- タイムアウト自動検出（デフォルト 5000ms）
- 指数バックオフ リトライ（最大 3 回）
- サーバーエラー（5xx）の自動リトライ
- ネットワークエラーの詳細情報

```typescript
import { DemandAPIClient } from '@/services/DemandAPIClient';

const client = new DemandAPIClient();
const demand = await client.fetchStationDemand(1);
```

### 2. **demandStore.ts** - 状態管理

React Context + useReducer で状態を管理します。

**機能**:
- 駅需要データのキャッシング（5分）
- ローディング・エラー状態の管理
- オンライン/オフラインステータス

**使用方法**:

```typescript
import { DemandProvider, useDemand } from '@/state/demandStore';

// アプリのルートで DemandProvider をラップ
<DemandProvider>
  <App />
</DemandProvider>

// 任意のコンポーネント内で useDemand を使用
const { state, fetchMultipleStations } = useDemand();
```

### 3. **StationDemandScreen.tsx** - UI スクリーン

駅需要を視覚的に表示するスクリーンです。

**表示内容**:
- 駅名と需要率（%）
- 需要バーチャート（色分け）
- リスクレベル表示（低/中/高）
- トレンド表示（📈/📉/➡️）
- 信頼度（%）と更新時刻

**需要レベルの色分け**:
- 80%+ : 赤（高リスク）
- 60-79% : オレンジ（中リスク）
- 40-59% : 黄色（低-中）
- ~40% : 緑（低リスク）

---

## 🧪 テスト実行

### テスト実行コマンド

```bash
# すべてのテストを実行
npm test

# カバレッジレポート付きで実行
npm test -- --coverage

# 特定のテストファイルを実行
npm test DemandAPIClient.test.ts

# ウォッチモード
npm test -- --watch
```

### テストカバレッジ基準

| メトリクス | 基準 | 実装状況 |
|-----------|------|--------|
| ステートメント | 80%+ | ✅ |
| ブランチ | 80%+ | ✅ |
| 関数 | 80%+ | ✅ |
| ライン | 80%+ | ✅ |

### テストケース一覧

**DemandAPIClient.test.ts** (22 テストケース)
- ✅ 単一駅データ取得
- ✅ API エラーハンドリング（404, 500）
- ✅ タイムアウト処理・リトライ
- ✅ 複数駅データ取得
- ✅ 矩形範囲検索
- ✅ 指数バックオフ リトライ
- ✅ エッジケース（異常値、無効値）

**demandStore.test.ts** (15 テストケース)
- ✅ 初期状態確認
- ✅ 単一駅データ取得
- ✅ キャッシング機能
- ✅ エラーハンドリング
- ✅ 複数駅データ取得
- ✅ キャッシュクリア
- ✅ オンライン/オフライン切り替え

**StationDemandScreen.test.tsx** (10 テストケース)
- ✅ 初期ロード表示
- ✅ エラーメッセージ表示
- ✅ リフレッシュ機能
- ✅ 需要レベル色分け
- ✅ リスクレベル表示
- ✅ トレンドアイコン表示

---

## 🔌 API 仕様

### エンドポイント

#### 1. 単一駅の需要取得

```http
GET /api/stations/{stationId}/demand
Content-Type: application/json
```

**レスポンス例**:

```json
{
  "stationId": 1,
  "stationName": "Tokyo Station",
  "predicted_demand": 75,
  "risk_level": "high",
  "confidence": 0.92,
  "trend": "up",
  "last_updated": "2026-06-21T10:30:00Z"
}
```

#### 2. 複数駅の需要取得

```http
GET /api/stations/demands/batch?station_ids=1&station_ids=2&station_ids=3
Content-Type: application/json
```

**レスポンス例**:

```json
{
  "stations": [
    { "stationId": 1, "stationName": "Tokyo", "predicted_demand": 75, ... },
    { "stationId": 2, "stationName": "Shinjuku", "predicted_demand": 65, ... }
  ],
  "requestTime": 1621900200000,
  "responseTime": 150
}
```

#### 3. 矩形範囲内の駅需要取得

```http
GET /api/stations/demands/by-bounds?min_lat=35.0&max_lat=35.5&min_lng=139.0&max_lng=139.5
Content-Type: application/json
```

---

## ⚙️ 設定オプション

### DemandAPIClient 設定

```typescript
const client = new DemandAPIClient({
  baseUrl: 'http://api.example.com',
  timeout: 10000,
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
});
```

### リトライロジック

デフォルト設定:
- **最大リトライ回数**: 3 回
- **初期待機時間**: 1000ms
- **最大待機時間**: 10000ms
- **バックオフ乗数**: 2 倍

計算式:
```
待機時間 = min(初期待機時間 × (乗数 ^ 試行回数), 最大待機時間)
```

---

## 🛡️ エラーハンドリング

### エラーの種類

| コード | 説明 | リトライ可能 |
|------|------|------------|
| HTTP_4xx | クライアントエラー | ✗ |
| HTTP_5xx | サーバーエラー | ✓ |
| TIMEOUT | タイムアウト | ✓ |
| NETWORK_ERROR | ネットワーク接続エラー | ✓ |

### 例: エラーハンドリング

```typescript
try {
  const demand = await client.fetchStationDemand(1);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    console.error('リクエストがタイムアウトしました');
  } else if (error.retryable) {
    console.error('一時的なエラー。自動リトライされます');
  } else {
    console.error(`エラー: ${error.message}`);
  }
}
```

---

## 📊 パフォーマンス基準

### 実装目標

| メトリクス | 目標 | 備考 |
|-----------|------|------|
| API レスポンス時間 | < 200ms | ネットワーク遅延除外 |
| バッテリー消費 | < 15%/時間 | バックグラウンド更新時 |
| メモリ使用量 | < 100MB | 駅データ最大 1000 件 |
| UI レンダリング | 60fps | 再レンダリング最小化 |
| データ同期周期 | 1分 | バックグラウンドスレッド |

### 最適化テクニック

1. **キャッシング**: 5 分間のデータキャッシュ
2. **メモ化**: useCallback, useMemo 活用
3. **仮想化**: FlatList の virtualizedListProps
4. **バッチ処理**: 複数駅の一括リクエスト

---

## 🔒 セキュリティ機能

### 実装済み

- ✅ API キー のヘッダー設定対応
- ✅ HTTPS 通信対応（baseUrl で `https://` 指定）
- ✅ CORS ヘッダー自動追加
- ✅ タイムアウト保護
- ✅ リクエストキャンセル機能

### 推奨事項

```typescript
// 本番環境での設定
const client = new DemandAPIClient({
  baseUrl: 'https://api.taxinav.com/api',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Version': '1.0',
  },
  timeout: 8000,
});
```

---

## 📱 React Native/Expo 対応

### 対応プラットフォーム

- ✅ iOS 13+
- ✅ Android 9+
- ✅ Web（ブラウザ）

### 位置情報連携（拡張予定）

```typescript
import * as Location from 'expo-location';

const userLocation = await Location.getCurrentPositionAsync();
const demand = await client.fetchDemandByBounds({
  minLat: userLocation.latitude - 0.1,
  maxLat: userLocation.latitude + 0.1,
  minLng: userLocation.longitude - 0.1,
  maxLng: userLocation.longitude + 0.1,
});
```

---

## 🔄 統合方法

### アプリへの統合

**Step 1**: DemandProvider をアプリのルートにラップ

```typescript
// App.tsx
import { DemandProvider } from '@/state/demandStore';
import StationDemandScreen from '@/screens/StationDemandScreen';

export default function App() {
  return (
    <DemandProvider>
      <Stack.Navigator>
        <Stack.Screen 
          name="stations" 
          component={StationDemandScreen} 
        />
      </Stack.Navigator>
    </DemandProvider>
  );
}
```

**Step 2**: 任意のスクリーンで useDemand を使用

```typescript
import { useDemand } from '@/state/demandStore';

export const MyComponent = () => {
  const { state, fetchMultipleStations } = useDemand();
  
  useEffect(() => {
    fetchMultipleStations([1, 2, 3]);
  }, []);

  return <View>{/* UI */}</View>;
};
```

---

## 📚 型定義

### 主要な型

```typescript
// 駅の需要予測
interface StationDemand {
  stationId: number;
  stationName: string;
  predictedDemand: number;    // 0-100 (%)
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: number;          // Unix timestamp (ms)
  confidence: number;         // 0-1
  trend: 'up' | 'down' | 'stable';
}

// API エラー
interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: number;
  retryable: boolean;
}

// 状態管理
interface DemandState {
  stations: Map<number, StationDemand>;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: number | null;
  isOnline: boolean;
}
```

---

## 🐛 トラブルシューティング

### Q: テストが失敗する

**A**: 以下を確認してください

```bash
# キャッシュをクリア
npm run jest -- --clearCache

# 依存パッケージを再インストール
rm -rf node_modules package-lock.json
npm install
```

### Q: API に接続できない

**A**: 環境変数を確認

```bash
echo $EXPO_PUBLIC_API_URL
# http://localhost:8000/api が表示されるか確認
```

### Q: メモリ使用量が多い

**A**: キャッシュサイズを調整

```typescript
// demandStore.ts の キャッシュ時間を短縮
const CACHE_TTL = 2 * 60 * 1000; // 5 分 → 2 分
```

---

## 📊 コード品質

### TypeScript 厳格設定

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Linting ルール

```bash
npm run lint
```

---

## 🎯 次のステップ（v2.0 以降）

- [ ] オフラインモード（キャッシュのみ動作）
- [ ] リアルタイム更新（WebSocket）
- [ ] 位置情報自動更新
- [ ] プッシュ通知
- [ ] 多言語対応（i18n）
- [ ] ダークモード対応

---

## 📞 サポート

### 質問・バグ報告

```
GitHub Issues: [プロジェクトリポジトリ]/issues
Email: support@taxinav.dev
```

### ドキュメント参考

- [React Native 公式](https://reactnative.dev)
- [Expo 公式](https://expo.dev)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs/)

---

## 📄 ライセンス

MIT License - 詳細は LICENSE ファイルを参照

---

## ✅ 品質チェックリスト

実装班の確認事項:

- [x] TypeScript 100% 型定義完了
- [x] テストカバレッジ 80%+ 達成
- [x] エラーハンドリング完全実装
- [x] ドキュメント詳細記載
- [x] 依存パッケージ版固定
- [x] Git コミット形式統一

---

**作成日**: 2026年6月21日
**バージョン**: v1.0
**ステータス**: ✅ 実装完了 / テスト合格

