import { STATION_COORDINATES, GeoCoordinate } from '@/data/stationCoordinates';
import { StationDemand } from '@/types';
import {
  buildAutoRouteFromLocation,
  estimateTravelMinutes,
  formatTravelMinutes,
  haversineDistanceKm,
  sortStationDemands,
  sortStationDemandsByAutoRoute,
} from '@/utils/stationDemandSort';

const tokyoStation: GeoCoordinate = STATION_COORDINATES[1]!;

const sample: StationDemand[] = [
  {
    stationId: 1,
    stationName: '東京駅',
    predictedDemand: 85,
    riskLevel: 'high',
    timestamp: 1,
    confidence: 0.92,
    trend: 'up',
  },
  {
    stationId: 7,
    stationName: '新橋駅',
    predictedDemand: 75,
    riskLevel: 'medium',
    timestamp: 2,
    confidence: 0.9,
    trend: 'up',
  },
  {
    stationId: 2,
    stationName: '新宿駅',
    predictedDemand: 65,
    riskLevel: 'medium',
    timestamp: 3,
    confidence: 0.88,
    trend: 'stable',
  },
  {
    stationId: 3,
    stationName: '品川駅',
    predictedDemand: 35,
    riskLevel: 'low',
    timestamp: 4,
    confidence: 0.85,
    trend: 'down',
  },
];

describe('sortStationDemands', () => {
  it('default: stationId 昇順', () => {
    const shuffled = [sample[2], sample[0], sample[1]];
    const sorted = sortStationDemands(shuffled, 'default');
    expect(sorted.map((s) => s.stationId)).toEqual([1, 2, 7]);
  });

  it('demand: 需要降順', () => {
    const sorted = sortStationDemands(sample, 'demand');
    expect(sorted.map((s) => s.stationId)).toEqual([1, 7, 2, 3]);
  });

  it('confidence: 信頼度降順', () => {
    const sorted = sortStationDemands(sample, 'confidence');
    expect(sorted[0].stationId).toBe(1);
  });
});

describe('buildAutoRouteFromLocation', () => {
  const originNearTokyo: GeoCoordinate = {
    latitude: 35.6815,
    longitude: 139.767,
  };

  it('現在地から最寄り順に並べ、到着目安を付与する', () => {
    const plan = buildAutoRouteFromLocation(sample, originNearTokyo, STATION_COORDINATES);
    expect(plan.stations.length).toBe(4);
    expect(plan.legs.length).toBe(4);
    expect(plan.legs[0].cumulativeMinutes).toBeGreaterThan(0);
    expect(plan.legs[0].stationId).toBe(plan.stations[0].stationId);
    expect(plan.legs[3].cumulativeMinutes).toBeGreaterThan(plan.legs[0].cumulativeMinutes);
  });

  it('estimateTravelMinutes: 短距離は最低1分', () => {
    expect(estimateTravelMinutes(0.1)).toBe(1);
  });

  it('formatTravelMinutes: 60分未満', () => {
    expect(formatTravelMinutes(25)).toBe('約25分');
  });

  it('haversineDistanceKm: 同一地点は 0', () => {
    expect(haversineDistanceKm(tokyoStation, tokyoStation)).toBe(0);
  });
});

describe('sortStationDemandsByAutoRoute (legacy)', () => {
  it('駅起点でも build と同等の順序になる', () => {
    const legacy = sortStationDemandsByAutoRoute(sample, 1, STATION_COORDINATES);
    const modern = buildAutoRouteFromLocation(sample, STATION_COORDINATES[1]!, STATION_COORDINATES)
      .stations;
    expect(legacy.map((s) => s.stationId)).toEqual(modern.map((s) => s.stationId));
  });
});
