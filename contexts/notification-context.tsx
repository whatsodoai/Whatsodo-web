'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBusiness } from './business-context';
import { api } from '@/lib/api';
import { Message } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const FALLBACK_POLL_MS = 20000;

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
  const lastSeenRef = useRef<Record<string, string>>({});
  const lastSeenInitialized = useRef(false);

  const pushNotification = useCallback((notification: AppNotification) => {
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
  }, []);

  // REST fallback poll — guarantees notifications keep working even if the
  // socket never connects (Render free-tier cold start, dropped WebSocket
  // upgrade, network blips). Mirrors the resilience pattern already used in
  // the Inbox page's 30s fallback poll.
  useEffect(() => {
    if (!activeBusiness) return;
    lastSeenInitialized.current = false;

    const poll = async () => {
      try {
        const inbox = await api.getInbox(activeBusiness._id);
        const firstRun = !lastSeenInitialized.current;
        lastSeenInitialized.current = true;

        for (const item of inbox) {
          const prevSeen = lastSeenRef.current[item.phone];
          lastSeenRef.current[item.phone] = item.lastMessageTime;

          if (firstRun) continue; // don't notify for history on first load
          if (item.direction !== 'incoming') continue;
          if (prevSeen && new Date(item.lastMessageTime) <= new Date(prevSeen)) continue;

          pushNotification({
            id: `${item.phone}-${item.lastMessageTime}`,
            phone: item.phone,
            leadName: item.leadName ?? undefined,
            preview: item.lastMessage,
            createdAt: item.lastMessageTime,
            read: false,
          });
        }
      } catch {}
    };

    poll();
    const timer = setInterval(poll, FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [activeBusiness, pushNotification]);

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

        lastSeenRef.current[payload.phone] = payload.message.createdAt;

        pushNotification({
          id: payload.message._id,
          phone: payload.phone,
          leadName: payload.leadName,
          preview: payload.message.message,
          createdAt: payload.message.createdAt,
          read: false,
        });
      }
    );

    return () => {
      socket.emit('leave:business', activeBusiness._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeBusiness, pushNotification]);

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
