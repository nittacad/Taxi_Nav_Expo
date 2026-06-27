export interface NotificationSettings {
  /** 通知半径 km */
  searchRadiusKm: number;
  /** ビジネスチェーン（CO 10:00）通知を有効にする */
  businessChainNotificationsEnabled: boolean;
  /** 株主総会（終了60分前）通知を有効にする */
  shareholderMeetingNotificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  searchRadiusKm: 3,
  businessChainNotificationsEnabled: true,
  shareholderMeetingNotificationsEnabled: true,
};

type Listener = (settings: NotificationSettings) => void;

let settings: NotificationSettings = { ...DEFAULT_SETTINGS };
const listeners = new Set<Listener>();

function emit(): void {
  const snapshot = { ...settings };
  listeners.forEach((listener) => listener(snapshot));
}

export function getNotificationSettings(): NotificationSettings {
  return { ...settings };
}

export function subscribeNotificationSettings(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...settings });
  return () => {
    listeners.delete(listener);
  };
}

export function updateNotificationSettings(
  patch: Partial<NotificationSettings>
): NotificationSettings {
  settings = { ...settings, ...patch };
  emit();
  return { ...settings };
}

/** @internal テスト用 */
export function resetNotificationSettingsForTests(): void {
  settings = { ...DEFAULT_SETTINGS };
  emit();
}
