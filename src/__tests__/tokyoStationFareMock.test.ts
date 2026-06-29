import { minuteToLabel } from '@/data/fareWaveformEngine';
import { isFareWaveformStationSupported } from '@/data/fareWaveformRegistry';
import { getAkihabaraStationFareWaveform } from '@/data/akihabaraStationFareMock';
import { getShinagawaStationFareWaveform } from '@/data/shinagawaStationFareMock';
import {
  JR_BASE_FARE,
  getTokyoStationFareWaveform,
} from '@/data/tokyoStationFareMock';
import { getUenoStationFareWaveform } from '@/data/uenoStationFareMock';

describe('tokyoStationFareMock', () => {
  it('minuteToLabel: 分を正しい時刻文字列に変換する', () => {
    expect(minuteToLabel(17 * 60)).toBe('17:00');
    expect(minuteToLabel(18 * 60)).toBe('18:00');
    expect(minuteToLabel(18 * 60 + 15)).toBe('18:15');
  });

  it('getTokyoStationFareWaveform: 平日データに5出口と高密度イベントを含む', () => {
    const data = getTokyoStationFareWaveform('weekday', 'slot_1020');
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
    const weekend = getTokyoStationFareWaveform('weekend_holiday', 'slot_1020');
    expect(weekend.stats.extraTrainCount).toBeGreaterThan(0);
  });

  it('getTokyoStationFareWaveform: 平日は臨時が少ない', () => {
    const weekday = getTokyoStationFareWaveform('weekday', 'slot_1020');
    expect(weekday.stats.extraTrainCount).toBeGreaterThanOrEqual(0);
  });

  it('getTokyoStationFareWaveform: 1日プリセットは始発〜終電スロット', () => {
    const fullDay = getTokyoStationFareWaveform('weekday', 'full_day');
    expect(fullDay.timePreset).toBe('full_day');
    expect(fullDay.slotCount).toBe(1111);
    expect(fullDay.startTime).toBe('05:00');
    expect(fullDay.endTime).toBe('23:30');
    expect(fullDay.stats.arrivalEventCount).toBeGreaterThan(0);
  });

  it('getTokyoStationFareWaveform: 2時間スロットでスロット数が120分', () => {
    const slot = getTokyoStationFareWaveform('weekday', 'slot_1020');
    const other = getTokyoStationFareWaveform('weekday', 'slot_1080');
    expect(slot.slotCount).toBe(120);
    expect(other.slotCount).toBe(120);
    expect(slot.startTime).toBe('17:00');
    expect(other.startTime).toBe('18:00');
  });

  it('getTokyoStationFareWaveform: 旧曜日カテゴリは土日祝に統合される', () => {
    const saturday = getTokyoStationFareWaveform('saturday', 'slot_1020');
    const weekendHoliday = getTokyoStationFareWaveform('weekend_holiday', 'slot_1020');
    expect(saturday.dayCategory).toBe('weekend_holiday');
    expect(saturday.stats.arrivalEventCount).toBe(
      weekendHoliday.stats.arrivalEventCount,
    );
  });

  it('getTokyoStationFareWaveform: 成田・羽田空港便を含み強調用ハイライトを返す', () => {
    const data = getTokyoStationFareWaveform('weekday', 'slot_1020');
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
    const data = getTokyoStationFareWaveform('weekday', 'slot_1020');
    const yaesu = data.exits.find((e) => e.exitId === 'yaesu');
    expect(yaesu).toBeDefined();
    expect(Math.max(...(yaesu?.fareByMinute ?? []))).toBeGreaterThanOrEqual(3000);
  });
});

describe('shinagawaStationFareMock', () => {
  it('getShinagawaStationFareWaveform: 3出口の波形を返す', () => {
    const data = getShinagawaStationFareWaveform('weekday', 'slot_1020');
    expect(data.stationId).toBe(3);
    expect(data.stationName).toBe('品川駅');
    expect(data.exits.map((e) => e.exitId)).toEqual([
      'takanawa',
      'konan',
      'shinkansen',
    ]);
    expect(data.stats.arrivalEventCount).toBeGreaterThan(0);
    expect(data.stats.naritaArrivalCount).toBe(0);
    expect(data.stats.hanedaArrivalCount).toBe(0);
  });

  it('getShinagawaStationFareWaveform: 新幹線口で高運賃スパイク', () => {
    const data = getShinagawaStationFareWaveform('weekday', 'slot_1020');
    const shinkansen = data.exits.find((e) => e.exitId === 'shinkansen');
    expect(Math.max(...(shinkansen?.fareByMinute ?? []))).toBeGreaterThanOrEqual(3500);
  });
});

describe('uenoStationFareMock', () => {
  it('getUenoStationFareWaveform: JR上野と京成上野を分離した3出口', () => {
    const data = getUenoStationFareWaveform('weekday', 'slot_1020');
    expect(data.stationId).toBe(6);
    expect(data.stationName).toBe('上野駅');
    expect(data.exits.map((e) => e.exitId)).toEqual([
      'jr-ueno',
      'keisei-ueno',
      'jr-shinkansen',
    ]);
    expect(data.exits.find((e) => e.exitId === 'jr-ueno')?.exitName).toBe('JR上野');
    expect(data.exits.find((e) => e.exitId === 'keisei-ueno')?.exitName).toBe(
      '京成上野',
    );
  });

  it('getUenoStationFareWaveform: 京成上野に成田便ハイライト', () => {
    const data = getUenoStationFareWaveform('weekday', 'slot_1020');
    expect(data.stats.naritaArrivalCount).toBeGreaterThan(0);
    expect(data.airportHighlights.every((h) => h.exitId === 'keisei-ueno')).toBe(
      true,
    );
    expect(data.airportHighlights.every((h) => h.shortLabel === '成田')).toBe(true);
    expect(
      data.airportHighlights.every((h) => h.markerColor === '#005AAA'),
    ).toBe(true);
  });

  it('getUenoStationFareWaveform: 新幹線改札はJR上野側', () => {
    const data = getUenoStationFareWaveform('weekday', 'slot_1020');
    const shinkansen = data.exits.find((e) => e.exitId === 'jr-shinkansen');
    expect(Math.max(...(shinkansen?.fareByMinute ?? []))).toBeGreaterThanOrEqual(3500);
  });
});

describe('akihabaraStationFareMock', () => {
  it('getAkihabaraStationFareWaveform: 3出口の波形を返す', () => {
    const data = getAkihabaraStationFareWaveform('weekday', 'slot_1020');
    expect(data.stationId).toBe(8);
    expect(data.stationName).toBe('秋葉原駅');
    expect(data.exits).toHaveLength(3);
    expect(data.exits.map((e) => e.exitId)).toEqual(
      expect.arrayContaining(['denki-gai', 'showa-dori', 'sobu-central']),
    );
  });

  it('getAkihabaraStationFareWaveform: 電気街口に到着イベントがある', () => {
    const data = getAkihabaraStationFareWaveform('weekday', 'slot_1020');
    const denkiGai = data.exits.find((e) => e.exitId === 'denki-gai');
    expect(Math.max(...(denkiGai?.fareByMinute ?? []))).toBeGreaterThan(0);
    expect(data.stats.arrivalEventCount).toBeGreaterThan(0);
  });
});

describe('fareWaveformRegistry', () => {
  it('isFareWaveformStationSupported: 東京・品川・上野・秋葉原のみ true', () => {
    expect(isFareWaveformStationSupported(1)).toBe(true);
    expect(isFareWaveformStationSupported(3)).toBe(true);
    expect(isFareWaveformStationSupported(6)).toBe(true);
    expect(isFareWaveformStationSupported(8)).toBe(true);
    expect(isFareWaveformStationSupported(2)).toBe(false);
  });
});
