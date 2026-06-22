'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, MessageSquare } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useBusiness } from '@/contexts/business-context';
import { useNotifications } from '@/contexts/notification-context';
import { formatRelativeTime } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/inbox': 'Inbox',
  '/appointments': 'Appointments',
  '/appointments/calendar': 'Calendar',
  '/campaigns': 'Campaigns',
  '/knowledge-base': 'Knowledge Base',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { refreshBusinesses } = useBusiness();
  const { notifications, unreadCount, connected, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ||
    'Whatsodo';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="h-16 bg-surface-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-gray-100 font-semibold text-lg leading-tight">{title}</h1>
        <p className="text-gray-500 text-xs">
          {dateStr} · {timeStr}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="relative hidden md:flex items-center pl-8 pr-2.5 py-1.5 text-sm bg-white/5 text-gray-500 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all w-52"
        >
          <Search className="absolute left-3 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => refreshBusinesses()}
          className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen((v) => !v);
              if (!open) markAllRead();
            }}
            className="relative p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors"
            title={connected ? 'Live' : 'Polling'}
          >
            <Bell size={16} />
            <span
              className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-green-500' : 'bg-amber-400'
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-glass z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-100">Notifications</p>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    connected
                      ? 'text-green-300 bg-green-500/10'
                      : 'text-amber-300 bg-amber-500/10'
                  }`}
                >
                  {connected ? 'Live' : 'Polling'}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No new messages</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                        router.push('/inbox');
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                        n.read ? '' : 'bg-green-500/[0.06]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={14} className="text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-100 truncate">
                          {n.leadName || n.phone}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{n.preview}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
