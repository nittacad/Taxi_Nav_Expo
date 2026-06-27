/**
 * ビジネスチェーン店舗シード — Nominatim/OSM から生成（手動再生成可）
 * 生成: node scripts/fetch-business-chain-seed.mjs
 * 範囲: Phase1 東・都心優先 viewbox
 * 件数: 27
 * 生成日: 2026-06-27
 */

import type { BusinessChainLocation } from '@/types/businessChain';

export const BUSINESS_CHAIN_SEED_LOCATIONS: readonly BusinessChainLocation[] = [
  { id: 'apa_35d65806_139d81875', chainId: 'apa', name: 'アパホテル', latitude: 35.658064, longitude: 139.818746, source: 'seed', address: 'アパホテル, 潮見二丁目, 江東区, 東京都, 135-8585, 日本' },
  { id: 'apa_35d65784_139d81881', chainId: 'apa', name: 'アパホテル', latitude: 35.657836, longitude: 139.818808, source: 'seed', address: 'アパホテル, 潮見二丁目, 江東区, 東京都, 135-8585, 日本' },
  { id: 'apa_35d68634_139d79159', chainId: 'apa', name: 'アパホテル', latitude: 35.686337, longitude: 139.791588, source: 'seed', address: 'アパホテル, 首都高速6号向島線, 日本橋浜町三丁目, 日本橋浜町, 中央区, 東京都, 103-0008, 日本' },
  { id: 'apa_35d69309_139d78241', chainId: 'apa', name: 'アパホテル', latitude: 35.693086, longitude: 139.782412, source: 'seed', address: 'アパホテル, 江戸通り, 日本橋馬喰町一丁目, 日本橋馬喰町, 中央区, 東京都, 103-0002, 日本' },
  { id: 'apa_35d70619_139d79458', chainId: 'apa', name: 'アパホテル', latitude: 35.706189, longitude: 139.794576, source: 'seed', address: 'アパホテル, 江戸通り, 駒形二丁目, 駒形, 台東区, 東京都, 111-0051, 日本' },
  { id: 'apa_35d76331_139d82627', chainId: 'apa', name: 'アパホテル', latitude: 35.76331, longitude: 139.826271, source: 'seed', address: 'アパホテル, 江北橋通り, 綾瀬, 足立区, 東京都, 120-0005, 日本' },
  { id: 'apa_35d70575_139d79422', chainId: 'apa', name: 'アパホテル', latitude: 35.70575, longitude: 139.79422, source: 'seed', address: 'アパホテル, 6, 駒形二丁目, 駒形, 台東区, 東京都, 111-0043, 日本' },
  { id: 'apa_35d69371_139d78127', chainId: 'apa', name: 'アパホテル', latitude: 35.693709, longitude: 139.781273, source: 'seed', address: 'アパホテル, 清洲橋通り, 東神田一丁目, 東神田, 日本橋馬喰町, 千代田区, 東京都, 102-0000, 日本' },
  { id: 'apa_35d68827_139d78161', chainId: 'apa', name: 'アパホテル 人形町駅北', latitude: 35.688269, longitude: 139.781608, source: 'seed', address: 'アパホテル 人形町駅北, 三光新道, 日本橋堀留町二丁目, 日本橋堀留町, 中央区, 東京都, 103-0012, 日本' },
  { id: 'apa_35d70562_139d79449', chainId: 'apa', name: 'アパホテル 浅草 蔵前 パーキング', latitude: 35.705616, longitude: 139.794489, source: 'seed', address: 'アパホテル 浅草 蔵前 パーキング, 隅田川テラス, 駒形二丁目, 駒形, 台東区, 東京都, 111-0051, 日本' },
  { id: 'apa_35d68813_139d78413', chainId: 'apa', name: 'アパホテル〈人形町駅東〉', latitude: 35.688128, longitude: 139.784133, source: 'seed', address: 'アパホテル〈人形町駅東〉, みどり通り, 日本橋富沢町, 岩本町, 日本橋人形町, 中央区, 東京都, 103-0005, 日本' },
  { id: 'apa_35d70763_139d78220', chainId: 'apa', name: 'アパホテル〈浅草 新御徒町駅前〉', latitude: 35.707631, longitude: 139.782201, source: 'seed', address: 'アパホテル〈浅草 新御徒町駅前〉, 11, 元浅草一丁目, 元浅草, 台東区, 東京都, 111-0041, 日本' },
  { id: 'apa_35d68642_139d79160', chainId: 'apa', name: 'アパホテル〈日本橋浜町南〉', latitude: 35.686419, longitude: 139.791602, source: 'seed', address: 'アパホテル〈日本橋浜町南〉, 首都高速6号向島線, 日本橋浜町三丁目, 日本橋浜町, 中央区, 東京都, 103-0008, 日本' },
  { id: 'apa_35d66714_139d81063', chainId: 'apa', name: 'アパホテル東京木場', latitude: 35.667145, longitude: 139.810634, source: 'seed', address: 'アパホテル東京木場, 16, 東陽一丁目, 東陽, 江東区, 東京都, 135-0043, 日本' },
  { id: 'comfort_hotel_35d68223_139d79956', chainId: 'comfort_hotel', name: 'コンフォートホテル東京清澄白河', latitude: 35.682226, longitude: 139.799556, source: 'seed', address: 'コンフォートホテル東京清澄白河, 清洲橋通り, 白河一丁目, 白河, 江東区, 東京都, 135-0021, 日本' },
  { id: 'comfort_hotel_35d69414_139d78297', chainId: 'comfort_hotel', name: 'コンフォートホテル東京東日本橋', latitude: 35.694135, longitude: 139.782967, source: 'seed', address: 'コンフォートホテル東京東日本橋, 江戸通り, 日本橋馬喰町一丁目, 日本橋馬喰町, 中央区, 東京都, 103-0002, 日本' },
  { id: 'super_hotel_35d71501_139d79821', chainId: 'super_hotel', name: 'スーパーホテル', latitude: 35.71501, longitude: 139.798211, source: 'seed', address: 'スーパーホテル, 馬道通り, 浅草二丁目, 浅草, 台東区, 東京都, 111-0032, 日本' },
  { id: 'dormy_inn_35d67443_139d78076', chainId: 'dormy_inn', name: 'ドーミーイン東京八丁堀', latitude: 35.67443, longitude: 139.780758, source: 'seed', address: 'ドーミーイン東京八丁堀, 4, 新川二丁目, 新川, 中央区, 東京都, 104-0033, 日本' },
  { id: 'route_inn_35d69945_139d78731', chainId: 'route_inn', name: 'ホテルルートイン', latitude: 35.69945, longitude: 139.787308, source: 'seed', address: 'ホテルルートイン, 浅草橋二丁目, 浅草橋, 台東区, 東京都, 111-0052, 日本' },
  { id: 'sotetsu_fresa_35d66989_139d81764', chainId: 'sotetsu_fresa', name: '相鉄フレッサイン', latitude: 35.669893, longitude: 139.817639, source: 'seed', address: '相鉄フレッサイン, 永代通り, 東陽四丁目, 東陽, 江東区, 東京都, 136-0076, 日本' },
  { id: 'sotetsu_fresa_35d68082_139d78008', chainId: 'sotetsu_fresa', name: '相鉄フレッサイン 日本橋茅場町', latitude: 35.680816, longitude: 139.780078, source: 'seed', address: '相鉄フレッサイン 日本橋茅場町, 新大橋通り, 日本橋茅場町一丁目, 日本橋茅場町, 中央区, 東京都, 103-0016, 日本' },
  { id: 'toyoko_inn_35d69135_139d78092', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.691348, longitude: 139.780922, source: 'seed', address: '東横イン, 16, 日本橋大伝馬町, 中央区, 東京都, 103-0011, 日本' },
  { id: 'toyoko_inn_35d72143_139d78006', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.721433, longitude: 139.780065, source: 'seed', address: '東横イン, 言問通り, 根岸一丁目, 根岸, 台東区, 東京都, 110-0003, 日本' },
  { id: 'toyoko_inn_35d71841_139d79242', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.71841, longitude: 139.792417, source: 'seed', address: '東横イン, 国際通り, 千束一丁目, 千束, 台東区, 東京都, 111-0031, 日本' },
  { id: 'toyoko_inn_35d70616_139d79391', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.706158, longitude: 139.79391, source: 'seed', address: '東横イン, 13, 駒形一丁目, 駒形, 台東区, 東京都, 111-0043, 日本' },
  { id: 'toyoko_inn_35d68336_139d78104', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.683361, longitude: 139.781036, source: 'seed', address: '東横イン, 2, 日本橋蛎殻町一丁目, 日本橋蛎殻町, 中央区, 東京都, 103-0014, 日本' },
  { id: 'toyoko_inn_35d69940_139d78796', chainId: 'toyoko_inn', name: '東横イン', latitude: 35.699403, longitude: 139.787957, source: 'seed', address: '東横イン, 江戸通り, 柳橋二丁目, 柳橋, 台東区, 東京都, 111-0052, 日本' },
];
