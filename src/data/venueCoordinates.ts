/**
 * GPS coordinates for MASTER_VENUE_LIST entries (proximity filter + map focus).
 * Verified via OpenStreetMap Nominatim (2026-06-25) + facility_registry.py where noted.
 */

import type { VenueCoordinate } from '@/types/venueNotification';

export const VENUE_COORDINATES: Readonly<Record<string, VenueCoordinate>> = {
  // 帝国ホテル本館 — 内幸町1-1-1 (OSM verified)
  '帝国ホテル': { latitude: 35.6723, longitude: 139.7584 },
  // The Okura Tokyo — 虎ノ門2-10-4 (OSM verified)
  'ホテルオークラ東京': { latitude: 35.6670, longitude: 139.7440 },
  'ザ・ペニンシュラ東京': { latitude: 35.6745, longitude: 139.7607 },
  'パレスホテル東京': { latitude: 35.6845, longitude: 139.7612 },
  'ザ・リッツ・カールトン東京': { latitude: 35.6663, longitude: 139.7314 },
  'グランドハイアット東京': { latitude: 35.6599, longitude: 139.7283 },
  'パークハイアット東京': { latitude: 35.6851, longitude: 139.6910 },
  // 目黒区三田1-4-1（代々木ではない）
  'ウェスティンホテル東京': { latitude: 35.6415, longitude: 139.7154 },
  'コンラッド東京': { latitude: 35.6630, longitude: 139.7614 },
  '東京ステーションホテル': { latitude: 35.6810, longitude: 139.7659 },
  'マンダリンオリエンタル東京': { latitude: 35.6871, longitude: 139.7729 },
  'ザ・プリンスギャラリー 東京紀尾井町': { latitude: 35.6796, longitude: 139.7369 },
  'ザ・プリンス パークタワー東京': { latitude: 35.6554, longitude: 139.7471 },
  'ホテル椿山荘東京': { latitude: 35.7126, longitude: 139.7255 },
  'ジャヌ東京': { latitude: 35.6622, longitude: 139.7403 },
  // BELLUSTAR TOKYO — 新宿区歌舞伎町1-29-1（東急歌舞伎町タワー）
  'ベルスター東京': { latitude: 35.6959, longitude: 139.7006 },
  '東武ホテルレバント東京': { latitude: 35.6972, longitude: 139.8109 },
  '京王プラザホテル': { latitude: 35.6898, longitude: 139.6944 },
  '浅草ビューホテル': { latitude: 35.7155, longitude: 139.7919 },
  'グランドニッコー東京 台場': { latitude: 35.6251, longitude: 139.7719 },
  '三井ガーデンホテル豊洲プレミア': { latitude: 35.6550, longitude: 139.7945 },
  // Andaz Tokyo / 虎ノ門ヒルズ
  'ホテル虎ノ門ヒルズ': { latitude: 35.6674, longitude: 139.7494 },
  'ONE@Tokyo by insomnia': { latitude: 35.7100, longitude: 139.8128 },
  // 墨田区押上1-10-3（押上駅・スカイツリー側。横網/両国国技館ではない）
  'リッチモンドホテルプレミア東京スコーレ': { latitude: 35.7106, longitude: 139.8139 },
  '京成リッチモンドホテル 東京押上': { latitude: 35.7098, longitude: 139.8125 },
  '東京ドームホテル': { latitude: 35.7036, longitude: 139.7535 },
  // Pacific Century Place — 丸の内1-11-1
  'フォーシーズンズホテル東京丸の内': { latitude: 35.6781, longitude: 139.7670 },
  'シャングリラ 東京': { latitude: 35.6822, longitude: 139.7692 },
  'ホテルニューオータニ東京': { latitude: 35.6809, longitude: 139.7340 },
  '東京會舘': { latitude: 35.6790, longitude: 139.7638 },
  // 品川区北品川4-7-29
  '八芳園': { latitude: 35.5966, longitude: 139.7487 },
  // 芝公園内 浜松町1-20
  '明治記念会館': { latitude: 35.6569, longitude: 139.7561 },
};

export function getVenueCoordinate(venueName: string): VenueCoordinate | undefined {
  return VENUE_COORDINATES[venueName];
}
