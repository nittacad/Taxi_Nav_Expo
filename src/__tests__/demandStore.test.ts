import { demandReducer } from '../state/demandStore';
import { ApiError } from '../types';

describe('demandReducer', () => {
  const initialState = {
    stations: new Map(),
    loading: false,
    error: null,
    lastUpdated: null,
    isOnline: true,
  };

  it('SET_LOADING: loading が true になること', () => {
    jest.unmock('../state/demandStore'); // 一旦モックを解除
    const store = require('../state/demandStore');
    const state = store.demandReducer(initialState, { type: 'SET_LOADING', payload: true });
    expect(state.loading).toBe(true);
  });

  it('SET_ERROR: error がセットされ、loading が false になること', () => {
    jest.unmock('../state/demandStore');
    const store = require('../state/demandStore');
    const error: ApiError = { name: 'Error', code: 'ERR', message: 'fail', statusCode: 500, timestamp: 123, retryable: false };
    const state = store.demandReducer({ ...initialState, loading: true }, { type: 'SET_ERROR', payload: error });
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
  });

  it('ADD_STATION: Map に正しくデータが格納されること', () => {
    jest.unmock('../state/demandStore');
    const store = require('../state/demandStore');
    const station = {
      stationId: 1,
      stationName: '東京駅',
      predictedDemand: 100,
      riskLevel: 'high' as const,
      timestamp: 12345,
      confidence: 0.9,
      trend: 'up' as const
    };
    
    const state = store.demandReducer(initialState, { type: 'ADD_STATION', payload: station });
    expect(state.stations.get(1)?.stationName).toBe('東京駅');
    expect(state.lastUpdated).not.toBeNull();
  });
});