/**
 * Nominatim からビジネスチェーンホテルを取得し seed TS を生成する。
 * Phase 1: 東・都心優先 viewbox。--full で23区全体。
 *
 * 用法: node scripts/fetch-business-chain-seed.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/data/businessChainSeedLocations.ts');

const PRIORITY_VIEWBOX = { minLng: 139.78, maxLat: 35.78, maxLng: 139.92, minLat: 35.65 };
const FULL_VIEWBOX = { minLng: 139.55, maxLat: 35.82, maxLng: 139.92, minLat: 35.52 };

const CHAINS = [
  { id: 'apa', queries: ['APAホテル', 'アパホテル'] },
  { id: 'toyoko_inn', queries: ['東横イン'] },
  { id: 'super_hotel', queries: ['スーパーホテル'] },
  { id: 'dormy_inn', queries: ['ドーミーイン'] },
  { id: 'route_inn', queries: ['ホテルルートイン', 'ルートイン'] },
  { id: 'comfort_hotel', queries: ['コンフォートホテル'] },
  { id: 'daiwa_roynet', queries: ['ダイワロイネット', 'ロイネットホテル'] },
  { id: 'sotetsu_fresa', queries: ['相鉄フレッサ', '相鉄フレッサイン', 'フレッサイン'] },
];

const AREA_SUFFIXES = [
  '',
  ' 葛飾',
  ' 江戸川',
  ' 江東',
  ' 墨田',
  ' 台東',
  ' 中央区',
  ' 千代田',
  ' 文京',
  ' 新小岩',
  ' 錦糸町',
  ' 押上',
  ' 日本橋',
  ' 東京駅',
  ' 浅草',
  ' 上野',
];

function stableId(chainId, lat, lng) {
  return `${chainId}_${lat.toFixed(5)}_${lng.toFixed(5)}`.replace(/\./g, 'd');
}

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatimSearch(query, viewbox) {
  const params = new URLSearchParams({
    q: `${query} 東京都`,
    format: 'json',
    limit: '50',
    countrycodes: 'jp',
    viewbox: `${viewbox.minLng},${viewbox.maxLat},${viewbox.maxLng},${viewbox.minLat}`,
    bounded: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'TaxiNavExpo/1.0 (business-chain-seed)' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status} for ${query}`);
  return res.json();
}

function matchChainId(name, expectedId) {
  const patterns = CHAINS.find((c) => c.id === expectedId)?.queries ?? [];
  return patterns.some((p) => name.includes(p));
}

function writeSeedFile(locations, bboxLabel) {
  const lines = locations.map(
    (loc) =>
      `  { id: '${escapeTs(loc.id)}', chainId: '${loc.chainId}', name: '${escapeTs(loc.name)}', latitude: ${loc.latitude}, longitude: ${loc.longitude}, source: 'seed'${loc.address ? `, address: '${escapeTs(loc.address)}'` : ''} },`
  );

  const content = `/**
 * ビジネスチェーン店舗シード — Nominatim/OSM から生成（手動再生成可）
 * 生成: node scripts/fetch-business-chain-seed.mjs
 * 範囲: ${bboxLabel}
 * 件数: ${locations.length}
 * 生成日: ${new Date().toISOString().slice(0, 10)}
 */

import type { BusinessChainLocation } from '@/types/businessChain';

export const BUSINESS_CHAIN_SEED_LOCATIONS: readonly BusinessChainLocation[] = [
${lines.join('\n')}
];
`;

  fs.writeFileSync(OUT_PATH, content, 'utf8');
  console.log(`Wrote ${locations.length} locations → ${OUT_PATH}`);
}

async function main() {
  const useFull = process.argv.includes('--full');
  const viewbox = useFull ? FULL_VIEWBOX : PRIORITY_VIEWBOX;
  const label = useFull ? '23区+武蔵野+三鷹 viewbox' : 'Phase1 東・都心優先 viewbox';

  const seen = new Set();
  const locations = [];

  for (const chain of CHAINS) {
    for (const baseQuery of chain.queries) {
      for (const suffix of AREA_SUFFIXES) {
        const query = `${baseQuery}${suffix}`.trim();
        console.log(`Search: ${query}`);
        const results = await nominatimSearch(query, viewbox);
        await sleep(1100);

        for (const hit of results) {
          const name = hit.display_name?.split(',')[0] ?? hit.name ?? '';
          if (!matchChainId(name, chain.id) && !matchChainId(hit.display_name ?? '', chain.id)) {
            continue;
          }
          const lat = Number.parseFloat(hit.lat);
          const lon = Number.parseFloat(hit.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

          const id = stableId(chain.id, lat, lon);
          if (seen.has(id)) continue;
          seen.add(id);

          locations.push({
            id,
            chainId: chain.id,
            name: name || baseQuery,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
            address: hit.display_name,
            source: 'seed',
          });
        }
      }
    }
  }

  locations.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  const byChain = {};
  for (const loc of locations) {
    byChain[loc.chainId] = (byChain[loc.chainId] ?? 0) + 1;
  }
  console.log('By chain:', byChain);

  writeSeedFile(locations, label);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
