/** 1949-01-29 = 大安 を基準とした簡略六曜（6日周期） */
const ROKUYOU_BASE = new Date(1949, 0, 29);

export const ROKUYOU_NAMES = [
  '大安',
  '赤口',
  '先勝',
  '友引',
  '先負',
  '仏滅',
] as const;

export type RokuyouName = (typeof ROKUYOU_NAMES)[number];

export function getRokuyouIndex(date: Date): number {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const baseStart = new Date(ROKUYOU_BASE.getFullYear(), ROKUYOU_BASE.getMonth(), ROKUYOU_BASE.getDate());
  const daysDiff = Math.floor((dayStart.getTime() - baseStart.getTime()) / 86_400_000);
  return ((daysDiff % 6) + 6) % 6;
}

export function getRokuyouName(date: Date): RokuyouName {
  return ROKUYOU_NAMES[getRokuyouIndex(date)];
}

/** 大安・友引 → 1.5、それ以外 → 1.0 */
export function getRokuyouBoost(date: Date): number {
  const index = getRokuyouIndex(date);
  return index === 0 || index === 3 ? 1.5 : 1.0;
}

export function isRokuyouBoostDay(date: Date): boolean {
  return getRokuyouBoost(date) >= 1.5;
}
