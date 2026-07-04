'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Zap,
  Megaphone,
  Crown,
  Bot,
} from 'lucide-react';
import { cn, getInitials, avatarColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useBusiness } from '@/contexts/business-context';
import { useNotifications } from '@/contexts/notification-context';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ai-employees', label: 'AI Employees', icon: Bot },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare, badgeKey: 'unread' as const },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
  const { unreadCount } = useNotifications();
  const [showBizDropdown, setShowBizDropdown] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-950 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-soft">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">Whatsodo</p>
          <p className="text-gray-500 text-[11px]">AI Employee Platform</p>
        </div>
      </div>

      {/* Business Selector */}
      <div className="px-3 py-3">
        <button
          onClick={() => setShowBizDropdown(!showBizDropdown)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {activeBusiness?.businessName || 'Select Business'}
            </p>
            <p className="text-gray-500 text-[10px] truncate">
              {activeBusiness?.industry || 'No business'}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform',
              showBizDropdown && 'rotate-180'
            )}
          />
        </button>

        {showBizDropdown && businesses.length > 0 && (
          <div className="mt-1.5 bg-gray-900 rounded-xl overflow-hidden">
            {businesses.map((biz) => (
              <button
                key={biz._id}
                onClick={() => {
                  setActiveBusiness(biz);
                  setShowBizDropdown(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors',
                  activeBusiness?._id === biz._id
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-gray-300'
                )}
              >
                {biz.businessName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const badge = badgeKey === 'unread' ? unreadCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-green-500/15 text-green-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              )}
            >
              <Icon
                className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-green-400' : 'text-gray-500')}
              />
              {label}
              {badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-green-500 rounded-full">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-white/5">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              pathname === '/settings'
                ? 'bg-green-500/15 text-green-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
            )}
          >
            <Settings
              size={18}
              className={cn(pathname === '/settings' ? 'text-green-400' : 'text-gray-500')}
            />
            Settings
          </Link>
        </div>
      </nav>

      {/* Upgrade to Pro */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
          <Crown className="w-5 h-5 text-yellow-300 mb-2 relative z-10" />
          <p className="text-white font-semibold text-sm relative z-10">Upgrade to Pro</p>
          <p className="text-green-100 text-xs mt-1 mb-3 relative z-10">
            Unlock advanced features and boost your performance.
          </p>
          <button className="w-full bg-white text-gray-900 text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors relative z-10">
            Upgrade Now →
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
              avatarColor(user?.name || 'U')
            )}
          >
            {getInitials(user?.name || 'User')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-[10px] truncate capitalize">{user?.role || user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
