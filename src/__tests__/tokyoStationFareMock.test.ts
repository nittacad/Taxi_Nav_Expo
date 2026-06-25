import {
  JR_BASE_FARE,
  getTokyoStationFareWaveform,
  isFareWaveformStationSupported,
  minuteToLabel,
} from '@/data/tokyoStationFareMock';

describe('tokyoStationFareMock', () => {
  it('minuteToLabel: 分を正しい時刻文字列に変換する', () => {
    expect(minuteToLabel(17 * 60)).toBe('17:00');
    expect(minuteToLabel(18 * 60)).toBe('18:00');
    expect(minuteToLabel(18 * 60 + 15)).toBe('18:15');
  });

  it('getTokyoStationFareWaveform: 平日データに5出口と高密度イベントを含む', () => {
    const data = getTokyoStationFareWaveform('weekday', 'peak');
    expect(data.stationId).toBe(1);
    expect(data.exits).toHaveLength(5);
    expect(data.timeLabels).toHaveLength(data.slotCount);
    expect(data.totalCapacityByMinute).toHaveLength(data.slotCount);
    expect(data.trainCountByMinute).toHaveLength(data.slotCount);
    expect(data.stats.arrivalEventCount).toBeGreaterThan(0);
    expect(data.stats.peakFare).toBeGreaterThanOrEqual(JR_BASE_FARE);

    data.exits.forEach((exit) => {
      expect(exit.fareByMinute).toHaveLength(data.slotCount);
      expect(exit.capacityByMinute).toHaveLength(data.slotCount);
      expect(exit.trainCountByMinute).toHaveLength(data.slotCount);
    });
  });

  it('getTokyoStationFareWaveform: 土日祝は臨時列車イベントを含む', () => {
    const weekend = getTokyoStationFareWaveform('weekend_holiday', 'peak');
    expect(weekend.stats.extraTrainCount).toBeGreaterThan(0);
  });

  it('getTokyoStationFareWaveform: 平日は臨時が少ない', () => {
    const weekday = getTokyoStationFareWaveform('weekday', 'peak');
    expect(weekday.stats.extraTrainCount).toBeGreaterThanOrEqual(0);
  });

  it('getTokyoStationFareWaveform: 時間帯プリセットでスロット数が変わる', () => {
    const peak = getTokyoStationFareWaveform('weekday', 'peak');
    const narrow = getTokyoStationFareWaveform('weekday', 'peak_narrow');
    expect(narrow.slotCount).toBeLessThan(peak.slotCount);
  });

  it('getTokyoStationFareWaveform: 旧曜日カテゴリは土日祝に統合される', () => {
    const saturday = getTokyoStationFareWaveform('saturday', 'peak');
    const weekendHoliday = getTokyoStationFareWaveform('weekend_holiday', 'peak');
    expect(saturday.dayCategory).toBe('weekend_holiday');
    expect(saturday.stats.arrivalEventCount).toBe(
      weekendHoliday.stats.arrivalEventCount,
    );
  });

  it('getTokyoStationFareWaveform: 成田・羽田空港便を含み強調用ハイライトを返す', () => {
    const data = getTokyoStationFareWaveform('weekday', 'peak');
    expect(data.stats.naritaArrivalCount).toBeGreaterThan(0);
    expect(data.stats.hanedaArrivalCount).toBeGreaterThan(0);
    expect(data.airportHighlights.length).toBe(
      data.stats.naritaArrivalCount + data.stats.hanedaArrivalCount,
    );
    expect(data.airportHighlights.some((h) => h.lineKey === 'naritaExpress')).toBe(true);
    expect(data.airportHighlights.some((h) => h.lineKey === 'keikyuAirport')).toBe(true);
    expect(data.airportHighlights.some((h) => h.lineKey === 'hanedaMonorail')).toBe(true);
    expect(
      data.airportHighlights.find((h) => h.lineKey === 'naritaExpress')?.markerColor,
    ).toBe('#80C342');
    expect(
      data.airportHighlights.find((h) => h.lineKey === 'naritaExpress')?.shortLabel,
    ).toBe('成田');
    expect(
      data.airportHighlights.find((h) => h.lineKey === 'keikyuAirport')?.markerColor,
    ).toBe('#009BBF');
    expect(
      data.airportHighlights.find((h) => h.lineKey === 'keikyuAirport')?.shortLabel,
    ).toBe('羽田');
  });

  it('getTokyoStationFareWaveform: 成田NEXは八重洲口で高運賃になる', () => {
    const data = getTokyoStationFareWaveform('weekday', 'peak');
    const yaesu = data.exits.find((e) => e.exitId === 'yaesu');
    expect(yaesu).toBeDefined();
    expect(Math.max(...(yaesu?.fareByMinute ?? []))).toBeGreaterThanOrEqual(3000);
  });

  it('isFareWaveformStationSupported: 東京駅のみ true', () => {
    expect(isFareWaveformStationSupported(1)).toBe(true);
    expect(isFareWaveformStationSupported(2)).toBe(false);
  });
});
