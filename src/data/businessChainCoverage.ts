/**
 * 対象エリア: 東京23区 + 武蔵野市 + 三鷹市（おおまかな bbox）
 * シード優先: 奥戸営業所から行きやすい東・都心側（西・北・南端は後回し）
 */

/** 23区 + 武蔵野 + 三鷹 — 通知・蓄積の有効範囲 */
export const BUSINESS_CHAIN_SERVICE_BBOX = {
  minLat: 35.52,
  maxLat: 35.82,
  minLng: 139.55,
  maxLng: 139.92,
} as const;

/**
 * Phase 1 シード優先 bbox（葛飾・江戸川・江東・墨田・台東・中央・千代田・文京東部）
 * 奥戸（~35.769, 139.827）から 6:00–9:30 出発圏
 */
export const BUSINESS_CHAIN_PRIORITY_SEED_BBOX = {
  minLat: 35.65,
  maxLat: 35.78,
  minLng: 139.78,
  maxLng: 139.92,
} as const;

/** 奥戸営業所付近（発見クエリの起点参考） */
export const OKUDO_OFFICE = {
  latitude: 35.7689,
  longitude: 139.8267,
  label: '奥戸',
} as const;

export function isInServiceArea(latitude: number, longitude: number): boolean {
  const { minLat, maxLat, minLng, maxLng } = BUSINESS_CHAIN_SERVICE_BBOX;
  return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
}

export function isInPrioritySeedArea(latitude: number, longitude: number): boolean {
  const { minLat, maxLat, minLng, maxLng } = BUSINESS_CHAIN_PRIORITY_SEED_BBOX;
  return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
}
