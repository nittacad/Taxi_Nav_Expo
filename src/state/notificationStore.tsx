import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';

import type { AppNotificationRecord } from '@/types/notificationList';
import {
  clearNotificationHistory,
  getNotificationHistory,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationHistory,
} from '@/services/notificationHistory';

interface NotificationContextValue {
  notifications: readonly AppNotificationRecord[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<readonly AppNotificationRecord[]>([]);

  useEffect(() => {
    return subscribeNotificationHistory(setNotifications);
  }, []);

  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const title = response.notification.request.content.title ?? '';
      const body = response.notification.request.content.body ?? '';
      const history = getNotificationHistory();
      const match = history.find((item) => item.title === title && item.body === body);
      if (match) {
        markNotificationRead(match.id);
      }
    });

    return () => {
      responseSub.remove();
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: getUnreadNotificationCount(),
      markAllRead: markAllNotificationsRead,
      markRead: markNotificationRead,
      clearAll: clearNotificationHistory,
    }),
    [notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
