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
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-950 flex flex-col z-50 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-900/30">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">Whatsodo</p>
          <p className="text-gray-400 text-[11px]">AI WhatsApp CRM</p>
        </div>
      </div>

      {/* Business Selector */}
      <div className="px-3 py-3 border-b border-gray-800">
        <button
          onClick={() => setShowBizDropdown(!showBizDropdown)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors group"
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
          <div className="mt-1.5 bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            {businesses.map((biz) => (
              <button
                key={biz._id}
                onClick={() => {
                  setActiveBusiness(biz);
                  setShowBizDropdown(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-gray-800 transition-colors',
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-green-500/15 text-green-400 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-100'
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
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-800">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/settings'
                ? 'bg-green-500/15 text-green-400'
                : 'text-gray-400 hover:bg-gray-900 hover:text-gray-100'
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
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900">
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
