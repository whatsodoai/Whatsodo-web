'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useBusiness } from '@/contexts/business-context';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { formatRelativeTime, getInitials, avatarColor, cn } from '@/lib/utils';

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
  const { user } = useAuth();
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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-gray-900 font-bold text-lg leading-tight">{title}</h1>
        <p className="text-gray-400 text-xs">
          {dateStr} · {timeStr}
        </p>
      </div>

      <button
        onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="relative hidden md:flex items-center pl-9 pr-2.5 py-2 text-sm bg-gray-50 text-gray-400 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all flex-1 max-w-md"
      >
        <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <span className="flex-1 text-left truncate">Search leads, contacts, campaigns...</span>
        <kbd className="text-[10px] text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => refreshBusinesses()}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title={connected ? 'Live' : 'Polling'}
          >
            <Bell size={18} />
            <span
              className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-green-500' : 'bg-amber-400'
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-soft-xl z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    connected ? 'text-green-700 bg-green-100' : 'text-amber-700 bg-amber-100'
                  }`}
                >
                  {connected ? 'Live' : 'Polling'}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">No new messages</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                        router.push('/inbox');
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        n.read ? '' : 'bg-green-50/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={14} className="text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {n.leadName || n.phone}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{n.preview}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-100">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
              avatarColor(user?.name || 'U')
            )}
          >
            {getInitials(user?.name || 'User')}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role || 'Member'}</p>
          </div>
          <ChevronDown size={14} className="hidden lg:block text-gray-400" />
        </div>
      </div>
    </header>
  );
}
