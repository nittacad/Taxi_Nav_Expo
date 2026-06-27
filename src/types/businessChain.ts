/**
 * ビジネスホテルチェーン（CO 10:00）— 近傍検出・通知用型
 */

export type BusinessChainId =
  | 'apa'
  | 'toyoko_inn'
  | 'super_hotel'
  | 'dormy_inn'
  | 'route_inn'
  | 'comfort_hotel'
  | 'daiwa_roynet'
  | 'sotetsu_fresa';

export type BusinessChainLocationSource = 'seed' | 'discovered';

export interface BusinessChainDefinition {
  id: BusinessChainId;
  /** 通知・一覧表示名 */
  displayName: string;
  checkoutTime: '10:00';
  /** OSM / 店舗名マッチ用（小文字・半角化前の原文パターン） */
  matchPatterns: readonly string[];
}

export interface BusinessChainLocation {
  /** 安定ID: chainId + lat/lng ハッシュ */
  id: string;
  chainId: BusinessChainId;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  source: BusinessChainLocationSource;
  /** ISO8601 — discovered のみ */
  discoveredAt?: string;
}

export interface NearbyBusinessChainLocation extends BusinessChainLocation {
  distanceKm: number;
  chainDisplayName: string;
}
