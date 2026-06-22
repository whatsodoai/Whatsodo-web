'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Megaphone,
  UserPlus,
  Search,
} from 'lucide-react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Lead, InboxItem } from '@/types';
import { getInitials, avatarColor, cn } from '@/lib/utils';

const NAV_ACTIONS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, []);

  const loadData = useCallback(() => {
    if (!activeBusiness || loaded) return;
    Promise.all([api.getLeads(activeBusiness._id), api.getInbox(activeBusiness._id)])
      .then(([l, i]) => {
        setLeads(l);
        setInbox(i);
        setLoaded(true);
      })
      .catch(() => {});
  }, [activeBusiness, loaded]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  // Reload lead/inbox data the next time the palette opens after switching business
  useEffect(() => {
    setLoaded(false);
  }, [activeBusiness?._id]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className="fixed inset-0 z-[100]"
      shouldFilter
    >
      <div className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative mx-auto mt-[12vh] w-full max-w-lg animate-slide-up">
        <div className="rounded-2xl border border-white/10 bg-surface-900/95 backdrop-blur-xl shadow-glass overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 border-b border-white/10">
            <Search size={15} className="text-gray-500 flex-shrink-0" />
            <Command.Input
              placeholder="Search leads, conversations, or jump to a page..."
              className="w-full bg-transparent py-3.5 text-sm text-gray-100 placeholder:text-gray-500 outline-none"
            />
            <kbd className="hidden sm:inline-block text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate" className="text-[11px] font-medium text-gray-500 px-2 py-1.5">
              {NAV_ACTIONS.map(({ href, label, icon: Icon }) => (
                <Command.Item
                  key={href}
                  value={`nav ${label}`}
                  onSelect={() => go(href)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 cursor-pointer',
                    'data-[selected=true]:bg-green-500/10 data-[selected=true]:text-green-300'
                  )}
                >
                  <Icon size={16} className="text-gray-500" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {leads.length > 0 && (
              <Command.Group heading="Leads" className="text-[11px] font-medium text-gray-500 px-2 py-1.5 mt-2">
                {leads.slice(0, 30).map((lead) => (
                  <Command.Item
                    key={lead._id}
                    value={`lead ${lead.name} ${lead.phone}`}
                    onSelect={() => go(`/leads/${lead._id}`)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 cursor-pointer',
                      'data-[selected=true]:bg-green-500/10 data-[selected=true]:text-green-300'
                    )}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0',
                        avatarColor(lead.name)
                      )}
                    >
                      {getInitials(lead.name)}
                    </span>
                    <span className="truncate">{lead.name}</span>
                    <span className="text-gray-500 text-xs truncate ml-auto">{lead.phone}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {inbox.length > 0 && (
              <Command.Group heading="Conversations" className="text-[11px] font-medium text-gray-500 px-2 py-1.5 mt-2">
                {inbox.slice(0, 20).map((item) => (
                  <Command.Item
                    key={item.phone}
                    value={`conversation ${item.leadName ?? ''} ${item.phone}`}
                    onSelect={() => go('/inbox')}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 cursor-pointer',
                      'data-[selected=true]:bg-green-500/10 data-[selected=true]:text-green-300'
                    )}
                  >
                    <MessageSquare size={15} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{item.leadName || item.phone}</span>
                    <span className="text-gray-500 text-xs truncate ml-auto">{item.lastMessage}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="text-[11px] font-medium text-gray-500 px-2 py-1.5 mt-2">
              <Command.Item
                value="add lead create lead"
                onSelect={() => go('/leads')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 cursor-pointer',
                  'data-[selected=true]:bg-green-500/10 data-[selected=true]:text-green-300'
                )}
              >
                <UserPlus size={16} className="text-gray-500" />
                Add a new lead
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
}
