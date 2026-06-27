/** ホテルではない OSM 名称を除外 */
export function isLikelyBusinessChainHotel(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  if (/パーキング|Parking|駐車場|コインパ/i.test(n)) return false;
  return true;
}
