/**
 * demandStore.ts
 * 駅需要データの状態管理（React Context + useReducer）
 */

import React, { createContext, useReducer, ReactNode, useCallback } from 'react';
import { StationDemand, DemandState, ApiError } from '@/types';
import { demandApiClient } from '@/services/DemandAPIClient';

/**
 * Action の型定義
 */
type DemandAction =
  | {
      type: 'SET_LOADING';
      payload: boolean;
    }
  | {
      type: 'SET_ERROR';
      payload: ApiError | null;
    }
  | {
      type: 'SET_STATIONS';
      payload: StationDemand[];
    }
  | {
      type: 'ADD_STATION';
      payload: StationDemand;
    }
  | {
      type: 'UPDATE_ONLINE_STATUS';
      payload: boolean;
    }
  | {
      type: 'CLEAR_CACHE';
    };

/**
 * 初期状態
 */
const initialState: DemandState = {
  stations: new Map(),
  loading: false,
  error: null,
  lastUpdated: null,
  isOnline: true,
};

/**
 * Reducer 関数
 */
export const demandReducer = (
  state: DemandState,
  action: DemandAction
): DemandState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_STATIONS':
      const newMap = new Map<number, StationDemand>();
      action.payload.forEach((station) => {
        newMap.set(station.stationId, station);
      });
      return {
        ...state,
        stations: newMap,
        lastUpdated: Date.now(),
        loading: false,
        error: null,
      };

    case 'ADD_STATION':
      const updatedMap = new Map(state.stations);
      updatedMap.set(action.payload.stationId, action.payload);
      return {
        ...state,
        stations: updatedMap,
        lastUpdated: Date.now(),
      };

    case 'UPDATE_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };

    case 'CLEAR_CACHE':
      return initialState;

    default:
      return state;
  }
};

/**
 * Context の型定義
 */
interface DemandContextValue {
  state: DemandState;
  fetchStationDemand: (stationId: number) => Promise<StationDemand | null>;
  fetchMultipleStations: (stationIds: number[]) => Promise<StationDemand[] | null>;
  fetchDemandByBounds: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => Promise<StationDemand[] | null>;
  clearCache: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

/**
 * DemandContext の作成
 */
export const DemandContext = createContext<DemandContextValue | undefined>(
  undefined
);

/**
 * DemandProvider コンポーネント
 */
export const DemandProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(demandReducer, initialState);

  /**
   * 単一の駅需要を取得
   */
  const fetchStationDemand = useCallback(
    async (stationId: number): Promise<StationDemand | null> => {
      // キャッシュをチェック（5分以内）
      const cached = state.stations.get(stationId);
      if (
        cached &&
        state.lastUpdated &&
        Date.now() - state.lastUpdated < 5 * 60 * 1000
      ) {
        return cached;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const demand = await demandApiClient.fetchStationDemand(stationId);
        dispatch({ type: 'ADD_STATION', payload: demand });
        return demand;
      } catch (error) {
        const apiError = error as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError,
        });
        return null;
      }
    },
    [state.stations, state.lastUpdated]
  );

  /**
   * 複数駅の需要を取得
   */
  const fetchMultipleStations = useCallback(
    async (stationIds: number[]): Promise<StationDemand[] | null> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // リトライ時にエラーをクリア

      try {
        const demands = await demandApiClient.fetchMultipleStationDemands(
          stationIds
        );
        dispatch({ type: 'SET_STATIONS', payload: demands });
        return demands;
      } catch (error) {
        const apiError = error as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError,
        });
        return null;
      }
    },
    []
  );

  /**
   * 矩形範囲内の駅需要を取得
   */
  const fetchDemandByBounds = useCallback(
    async (bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }): Promise<StationDemand[] | null> => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const demands = await demandApiClient.fetchDemandByBounds(bounds);
        dispatch({ type: 'SET_STATIONS', payload: demands });
        return demands;
      } catch (error) {
        const apiError = error as ApiError;
        dispatch({
          type: 'SET_ERROR',
          payload: apiError,
        });
        return null;
      }
    },
    []
  );

  /**
   * キャッシュをクリア
   */
  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  /**
   * オンライン/オフラインステータスを更新
   */
  const setOnlineStatus = useCallback((isOnline: boolean) => {
    dispatch({ type: 'UPDATE_ONLINE_STATUS', payload: isOnline });
  }, []);

  const value: DemandContextValue = {
    state,
    fetchStationDemand,
    fetchMultipleStations,
    fetchDemandByBounds,
    clearCache,
    setOnlineStatus,
  };

  return (
    <DemandContext.Provider value={value}>
      {children}
    </DemandContext.Provider>
  );
};

/**
 * useDemand フック
 * Context を使用するコンポーネント内で、この フック を使用
 */
export const useDemand = (): DemandContextValue => {
  const context = React.useContext(DemandContext);
  if (!context) {
    throw new Error('useDemand must be used within DemandProvider');
  }
  return context;
};
