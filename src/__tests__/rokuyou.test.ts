import { getRokuyouBoost, getRokuyouName, isRokuyouBoostDay } from '@/utils/rokuyou';

describe('rokuyou', () => {
  it('returns 大安 on 2026-06-20', () => {
    const date = new Date(2026, 5, 20);
    expect(getRokuyouName(date)).toBe('大安');
    expect(getRokuyouBoost(date)).toBe(1.5);
    expect(isRokuyouBoostDay(date)).toBe(true);
  });

  it('returns 赤口 on 2026-06-21', () => {
    const date = new Date(2026, 5, 21);
    expect(getRokuyouName(date)).toBe('赤口');
    expect(isRokuyouBoostDay(date)).toBe(false);
  });
});
