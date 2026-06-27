# 運賃波形オフライン閲覧

PC（Metro / Cursor）と切断した状態でも、**iPhone の Safari だけ**で運賃波形グラフを見られます。RCI は含みません。

## 使い方（iPhone）

1. PC 上で HTML を生成（下記）
2. 生成された `offline/fare-waveform.html` を iPhone へ送る  
   - AirDrop / iCloud Drive / メール添付 など
3. **重要**: ファイルのサムネイルをタップするだけ（クイックルック）では JS が動かず波形が出ません  
   - **ファイル** アプリで `fare-waveform.html` を長押し → **共有** → **Safari で開く**  
   - または共有 → **Safari** を選ぶ
4. （任意）Safari の共有 → **ホーム画面に追加** でアイコン化

以降は **オフライン** でも同じグラフが表示されます。

## HTML の再生成

モックデータを更新したあと、プロジェクトで実行:

```bash
cd Taxi_Nav_Expo
npm run build:offline-waveform
```

出力: `offline/fare-waveform.html`（単一ファイル・データ埋め込み）

## 含まれる内容

- 駅: 東京 / 品川 / 上野
- 曜日: 平日 / 土日祝
- 時間帯: 始発〜終電（5:00–23:30）/ 2時間刻みプルダウン
- 出口別運賃波形 + 凡例内オーバーレイ切替 + 空港マーカー（グラフ上）

## 波形が出ないとき

- **Safari で開いているか**（クイックルック / Chrome アプリ内プレビューは不可のことが多い）
- グラフ枠を **左右にスワイプ**（1日表示は横に長い）
- 時間帯はまず **17:00–19:00** を選ぶ（始発〜終電より軽い）
- 赤いエラーボックスが出たらその文言を確認
- PC で HTML を再生成して iPhone に **送り直す**

```
C:\Users\nitta\Claude\Projects\【ナビ】 特定情報誘導型・高性能ナビ（Googleマップ連携）\Taxi_Nav_Expo\offline\fare-waveform.html
```

## Expo アプリ本体について

開発中の **Expo Go** は PC の Metro サーバーが必要なため、切断すると動きません。  
アプリごとオフラインにしたい場合は別途 `npx expo run:ios --device` 等で実機ビルドが必要です。  
**グラフだけ**なら本 HTML が最も手軽です。
