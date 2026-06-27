import { resolveShareholderMeetingCoordinate } from '@/utils/shareholderMeetingLocation';

describe('shareholderMeetingLocation', () => {
  it('prefers schedule latitude/longitude', () => {
    const coord = resolveShareholderMeetingCoordinate({
      venueName: '帝国ホテル',
      latitude: 35.6723,
      longitude: 139.7587,
    });
    expect(coord).toEqual({ latitude: 35.6723, longitude: 139.7587 });
  });

  it('falls back to master venue registry', () => {
    const coord = resolveShareholderMeetingCoordinate({
      venueName: '東京国際フォーラム',
    });
    expect(coord?.latitude).toBeCloseTo(35.6766, 3);
  });

  it('returns undefined for unknown venue without coordinates', () => {
    expect(
      resolveShareholderMeetingCoordinate({ venueName: '存在しない会場' })
    ).toBeUndefined();
  });
});
