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
} from 'lucide-react';
import { cn, getInitials, avatarColor } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useBusiness } from '@/contexts/business-context';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
  const [showBizDropdown, setShowBizDropdown] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface-950/95 backdrop-blur-xl flex flex-col z-50 border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">Whatsodo</p>
          <p className="text-gray-500 text-[11px]">AI WhatsApp CRM</p>
        </div>
      </div>

      {/* Business Selector */}
      <div className="px-3 py-3 border-b border-white/10">
        <button
          onClick={() => setShowBizDropdown(!showBizDropdown)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
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
          <div className="mt-1.5 bg-surface-900 rounded-lg overflow-hidden border border-white/10">
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
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-green-500/15 to-cyan-500/10 text-green-400 border border-green-500/20 shadow-glow'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 flex-shrink-0',
                  isActive ? 'text-green-400' : 'text-gray-500'
                )}
                size={18}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-glow-pulse" />
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/10">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/settings'
                ? 'bg-gradient-to-r from-green-500/15 to-cyan-500/10 text-green-400 border border-green-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
            )}
          >
            <Settings
              size={18}
              className={cn(
                pathname === '/settings' ? 'text-green-400' : 'text-gray-500'
              )}
            />
            Settings
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
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
            <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
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
