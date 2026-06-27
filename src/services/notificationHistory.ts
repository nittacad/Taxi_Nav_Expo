import type { AppNotificationRecord, NotificationCategory } from '@/types/notificationList';

const MAX_NOTIFICATIONS = 100;

type Listener = (items: readonly AppNotificationRecord[]) => void;

let items: AppNotificationRecord[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  const snapshot = [...items];
  listeners.forEach((listener) => listener(snapshot));
}

export function inferNotificationCategory(title: string, body?: string): NotificationCategory {
  if (body?.includes('株主総会終了予定')) {
    return 'shareholder_meeting_boost';
  }
  if (body?.includes('六曜:') || body?.includes('【需要ブースト・大安】') || body?.includes('【需要ブースト・友引】')) {
    return 'rokuyou_boost';
  }
  if (body?.includes('ビジネスチェーン需要圏内')) {
    return 'business_chain_boost';
  }
  if (title.includes('ブースト') || title.includes('需要ブースト')) {
    return 'venue_boost';
  }
  if (title.includes('高需要') || title.includes('駅')) {
    return 'station_demand';
  }
  return 'other';
}

export function getNotificationHistory(): readonly AppNotificationRecord[] {
  return items;
}

export function subscribeNotificationHistory(listener: Listener): () => void {
  listeners.add(listener);
  listener([...items]);
  return () => {
    listeners.delete(listener);
  };
}

export function recordNotification(input: {
  title: string;
  body: string;
  category?: NotificationCategory;
  demandLevel?: AppNotificationRecord['demandLevel'];
  predictedDemand?: number;
  latitude?: number;
  longitude?: number;
}): AppNotificationRecord {
  const entry: AppNotificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    category: input.category ?? inferNotificationCategory(input.title),
    demandLevel: input.demandLevel,
    predictedDemand: input.predictedDemand,
    latitude: input.latitude,
    longitude: input.longitude,
    receivedAt: Date.now(),
    read: false,
  };

  items = [entry, ...items].slice(0, MAX_NOTIFICATIONS);
  emit();
  return entry;
}

export function markAllNotificationsRead(): void {
  items = items.map((item) => ({ ...item, read: true }));
  emit();
}

export function markNotificationRead(id: string): void {
  items = items.map((item) => (item.id === id ? { ...item, read: true } : item));
  emit();
}

export function clearNotificationHistory(): void {
  items = [];
  emit();
}

export function getUnreadNotificationCount(): number {
  return items.filter((item) => !item.read).length;
}

/** @internal テスト用 */
export function resetNotificationHistoryForTests(): void {
  items = [];
  emit();
}
