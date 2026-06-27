import {
  consumeMapFocus,
  requestMapFocus,
  resetMapFocusForTests,
  subscribeMapFocus,
} from '@/services/mapFocusStore';

describe('mapFocusStore', () => {
  beforeEach(() => {
    resetMapFocusForTests();
  });

  it('queues focus when no map listener is active', () => {
    requestMapFocus({
      latitude: 35.67,
      longitude: 139.76,
      label: '帝国ホテル',
    });

    expect(consumeMapFocus()).toEqual({
      latitude: 35.67,
      longitude: 139.76,
      label: '帝国ホテル',
    });
    expect(consumeMapFocus()).toBeNull();
  });

  it('notifies active map listener immediately', () => {
    const handler = jest.fn();
    subscribeMapFocus(handler);

    requestMapFocus({
      latitude: 35.68,
      longitude: 139.77,
      label: '東京駅',
    });

    expect(handler).toHaveBeenCalledWith({
      latitude: 35.68,
      longitude: 139.77,
      label: '東京駅',
    });
    expect(consumeMapFocus()).toBeNull();
  });
});
