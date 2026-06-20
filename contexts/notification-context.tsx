'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBusiness } from './business-context';
import { Message } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export interface AppNotification {
  id: string;
  phone: string;
  leadName?: string;
  preview: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { activeBusiness } = useBusiness();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (!activeBusiness) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:business', activeBusiness._id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on(
      'new:message',
      (payload: { businessId: string; phone: string; message: Message; leadName?: string }) => {
        if (payload.businessId !== activeBusiness._id) return;
        if (payload.message.direction !== 'incoming') return; // only notify on customer replies

        const notification: AppNotification = {
          id: payload.message._id,
          phone: payload.phone,
          leadName: payload.leadName,
          preview: payload.message.message,
          createdAt: payload.message.createdAt,
          read: false,
        };

        setNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
        });

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'default' && !permissionRequested.current) {
            permissionRequested.current = true;
            Notification.requestPermission();
          }
          if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            new Notification(notification.leadName || notification.phone, {
              body: notification.preview,
              tag: notification.id,
            });
          }
        }
      }
    );

    return () => {
      socket.emit('leave:business', activeBusiness._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeBusiness]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, connected, markAllRead, markRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
