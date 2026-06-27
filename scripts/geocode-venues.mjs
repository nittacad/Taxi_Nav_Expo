/**
 * MASTER_VENUE_LIST の施設を Nominatim (OpenStreetMap) でジオコーディングする。
 * 英語名検索 → 失敗時は住所のみ → 手動フォールバック座標。
 * 用法: node scripts/geocode-venues.mjs
 */

/** @type {Record<string, { english: string; address: string; fallback?: { latitude: number; longitude: number } }>} */
const VENUE_QUERIES = {
  '帝国ホテル': {
    english: 'Imperial Hotel Main Building Tokyo',
    address: '東京都千代田区内幸町1-1-1',
    fallback: { latitude: 35.6723, longitude: 139.7584 },
    preferFallback: true,
  },
  'ホテルオークラ東京': {
    english: 'The Okura Tokyo',
    address: '東京都港区虎ノ門2-10-4',
    fallback: { latitude: 35.6670, longitude: 139.7440 },
    preferFallback: true,
  },
  'ザ・ペニンシュラ東京': {
    english: 'The Peninsula Tokyo',
    address: '東京都千代田区有楽町1-8-1',
  },
  'パレスホテル東京': {
    english: 'Palace Hotel Tokyo',
    address: '東京都千代田区丸の内1-1-1',
  },
  'ザ・リッツ・カールトン東京': {
    english: 'The Ritz-Carlton Tokyo',
    address: '東京都港区赤坂9-7-1',
  },
  'グランドハイアット東京': {
    english: 'Grand Hyatt Tokyo',
    address: '東京都港区六本木6-10-3',
  },
  'パークハイアット東京': {
    english: 'Park Hyatt Tokyo',
    address: '東京都新宿区西新宿3-7-1-2',
  },
  'ウェスティンホテル東京': {
    english: 'The Westin Tokyo Meguro',
    address: '東京都目黒区三田1-4-1',
    fallback: { latitude: 35.6415, longitude: 139.7154 },
  },
  'コンラッド東京': {
    english: 'Conrad Tokyo',
    address: '東京都港区海岸1-9-1',
  },
  '東京ステーションホテル': {
    english: 'Tokyo Station Hotel',
    address: '東京都千代田区丸の内1-9-1',
  },
  'マンダリンオリエンタル東京': {
    english: 'Mandarin Oriental Tokyo',
    address: '東京都中央区日本橋2-1-1',
  },
  'ザ・プリンスギャラリー 東京紀尾井町': {
    english: 'The Prince Gallery Tokyo Kioicho',
    address: '東京都千代田区紀尾井町4-1',
  },
  'ザ・プリンス パークタワー東京': {
    english: 'The Prince Park Tower Tokyo',
    address: '東京都港区芝公園4-8-1',
  },
  'ホテル椿山荘東京': {
    english: 'Hotel Chinzanso Tokyo Bunkyo',
    address: '東京都文京区関口1-32-10',
    fallback: { latitude: 35.7126, longitude: 139.7255 },
  },
  'ジャヌ東京': {
    english: 'Janu Tokyo Azabudai',
    address: '東京都港区麻布台1-3-1',
  },
  'ベルスター東京': {
    english: 'BELLUSTAR TOKYO Kabukicho',
    address: '東京都新宿区歌舞伎町1-29-1',
    fallback: { latitude: 35.6959, longitude: 139.7006 },
  },
  '東武ホテルレバント東京': {
    english: 'Tobu Hotel Levant Tokyo',
    address: '東京都墨田区錦糸1-2-2',
  },
  '京王プラザホテル': {
    english: 'Keio Plaza Hotel Tokyo Shinjuku',
    address: '東京都新宿区西新宿2-2-1',
  },
  '浅草ビューホテル': {
    english: 'Asakusa View Hotel',
    address: '東京都台東区西浅草3-17-1',
  },
  'グランドニッコー東京 台場': {
    english: 'Grand Nikko Tokyo Daiba',
    address: '東京都港区台場2-6-1',
  },
  '三井ガーデンホテル豊洲プレミア': {
    english: 'Mitsui Garden Hotel Toyosu Premier',
    address: '東京都江東区豊洲2-2-1',
  },
  'ホテル虎ノ門ヒルズ': {
    english: 'Andaz Tokyo Toranomon Hills',
    address: '東京都港区虎ノ門1-23-1',
    fallback: { latitude: 35.6674, longitude: 139.7494 },
    preferFallback: true,
  },
  'ONE@Tokyo by insomnia': {
    english: 'ONE@Tokyo insomnia Oshiage',
    address: '東京都墨田区押上1-19-3',
    fallback: { latitude: 35.7100, longitude: 139.8128 },
  },
  'リッチモンドホテルプレミア東京スコーレ': {
    english: 'Richmond Hotel Premier Tokyo Oshiage',
    address: '東京都墨田区押上1-10-3',
    fallback: { latitude: 35.7106, longitude: 139.8139 },
  },
  '京成リッチモンドホテル 東京押上': {
    english: 'Keisei Richmond Hotel Tokyo Oshiage',
    address: '東京都墨田区押上1-33-3',
    fallback: { latitude: 35.7105, longitude: 139.8130 },
  },
  '東京ドームホテル': {
    english: 'Tokyo Dome Hotel',
    address: '東京都文京区後楽1-3-61',
  },
  'フォーシーズンズホテル東京丸の内': {
    english: 'Four Seasons Hotel Tokyo Marunouchi',
    address: '東京都千代田区丸の内1-11-1',
    fallback: { latitude: 35.6781, longitude: 139.7670 },
    preferFallback: true,
  },
  'シャングリラ 東京': {
    english: 'Shangri-La Tokyo',
    address: '東京都千代田区丸の内1-8-3',
  },
  'ホテルニューオータニ東京': {
    english: 'Hotel New Otani Tokyo',
    address: '東京都千代田区紀尾井町4-1',
  },
  '東京會舘': {
    english: 'Tokyo Kaikan Marunouchi',
    address: '東京都千代田区丸の内3-2-1',
    fallback: { latitude: 35.6790, longitude: 139.7638 },
  },
  '八芳園': {
    english: 'Happo-en Kitashinagawa Tokyo',
    address: '東京都品川区北品川4-7-29',
    fallback: { latitude: 35.5966, longitude: 139.7487 },
  },
  '明治記念会館': {
    english: 'Meiji Kinenkan Hamamatsucho',
    address: '東京都港区浜松町1-20',
    fallback: { latitude: 35.6569, longitude: 139.7561 },
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'jp');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'TaxiNavExpo/1.0 (venue coordinate verification)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data[0]) return null;
  return {
    latitude: Number.parseFloat(Number(data[0].lat).toFixed(4)),
    longitude: Number.parseFloat(Number(data[0].lon).toFixed(4)),
    displayName: data[0].display_name,
  };
}

async function resolveVenue(name, config) {
  if (config.preferFallback && config.fallback) {
    return {
      ...config.fallback,
      source: 'fallback-preferred',
      query: config.address,
      displayName: '(verified manual)',
    };
  }

  const englishQuery = `${config.english} Japan`;
  let coord = await geocode(englishQuery);
  if (coord) return { ...coord, source: 'nominatim-en', query: englishQuery };

  await sleep(1100);
  coord = await geocode(config.address);
  if (coord) return { ...coord, source: 'nominatim-address', query: config.address };

  if (config.fallback) {
    return {
      ...config.fallback,
      source: 'fallback',
      query: config.address,
      displayName: '(manual fallback)',
    };
  }
  return { error: 'not found', query: config.address };
}

async function main() {
  const results = {};
  for (const [name, config] of Object.entries(VENUE_QUERIES)) {
    const coord = await resolveVenue(name, config);
    results[name] = coord;
    console.log(JSON.stringify({ name, ...coord }));
    await sleep(1100);
  }
  console.log('\n--- TS OUTPUT ---\n');
  for (const [name, value] of Object.entries(results)) {
    if (value.latitude != null) {
      console.log(`  '${name}': { latitude: ${value.latitude}, longitude: ${value.longitude} },`);
    } else {
      console.log(`  // MISSING: ${name}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
