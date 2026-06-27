export type NotificationCategory =
  | 'venue_boost'
  | 'rokuyou_boost'
  | 'shareholder_meeting_boost'
  | 'business_chain_boost'
  | 'station_demand'
  | 'other';

export type NotificationDemandLevel = 'low' | 'medium' | 'high';

export interface AppNotificationRecord {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  receivedAt: number;
  read: boolean;
  /** 予測リストと同じ需要レベル（高/中/低） */
  demandLevel?: NotificationDemandLevel;
  /** 駅需要通知など、需要率が分かる場合 */
  predictedDemand?: number;
  /** 地図表示用の緯度経度 */
  latitude?: number;
  longitude?: number;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  venue_boost: '需要ブースト',
  rokuyou_boost: '六曜・結婚式',
  shareholder_meeting_boost: '株主総会',
  business_chain_boost: 'ビジネスチェーン',
  station_demand: '駅・高需要',
  other: 'その他',
};
