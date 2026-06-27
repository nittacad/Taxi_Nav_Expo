import { isInBusinessChainNotifyWindow } from '@/utils/businessChainTimeWindow';

describe('businessChainTimeWindow', () => {
  it('returns true between 9:30 and 10:00 inclusive', () => {
    expect(isInBusinessChainNotifyWindow(new Date(2026, 5, 25, 9, 29))).toBe(false);
    expect(isInBusinessChainNotifyWindow(new Date(2026, 5, 25, 9, 30))).toBe(true);
    expect(isInBusinessChainNotifyWindow(new Date(2026, 5, 25, 9, 45))).toBe(true);
    expect(isInBusinessChainNotifyWindow(new Date(2026, 5, 25, 10, 0))).toBe(true);
    expect(isInBusinessChainNotifyWindow(new Date(2026, 5, 25, 10, 1))).toBe(false);
  });
});
