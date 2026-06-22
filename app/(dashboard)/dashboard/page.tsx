'use client';

import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import {
  DashboardSummary,
  Lead,
  Appointment,
  InboxItem,
} from '@/types';
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  Trophy,
  XCircle,
  Phone,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatRelativeTime, getInitials, avatarColor, STATUS_CONFIG } from '@/lib/utils';
import { Reveal } from '@/components/motion/reveal';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  change?: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, gradient, iconBg, change, href }: StatCardProps) {
  const content = (
    <div className={cn('stat-card group', href && 'cursor-pointer')}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{title}</p>
      {change && (
        <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
          <TrendingUp size={11} /> {change}
        </p>
      )}
      <div className={cn('h-1 w-full rounded-full mt-3 opacity-20', gradient)} />
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function LeadVelocityBar({ leads }: { leads: Lead[] }) {
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const todayCount = leads.filter((l) => new Date(l.createdAt).toDateString() === todayStr).length;
  const yesterdayCount = leads.filter((l) => new Date(l.createdAt).toDateString() === yesterdayStr).length;
  const weekCount = leads.filter((l) => new Date(l.createdAt) >= weekAgo).length;

  const delta = todayCount - yesterdayCount;
  const pct = yesterdayCount > 0 ? Math.round(Math.abs(delta / yesterdayCount) * 100) : null;

  const items = [
    { label: 'Today', value: todayCount, color: 'text-green-700 bg-green-100' },
    { label: 'Yesterday', value: yesterdayCount, color: 'text-blue-700 bg-blue-100' },
    { label: 'Last 7 Days', value: weekCount, color: 'text-purple-700 bg-purple-100' },
  ];

  return (
    <div className="card p-5 flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 border-2 border-gray-900">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">Lead Velocity</p>
      </div>
      <div className="flex items-center gap-6 flex-1 flex-wrap">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn('text-xl font-bold tabular-nums px-2.5 py-0.5 rounded-lg', color)}>
              {value}
            </span>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      {pct !== null && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg',
          delta > 0 ? 'text-green-700 bg-green-100' : delta < 0 ? 'text-red-700 bg-red-100' : 'text-gray-400 bg-gray-100'
        )}>
          {delta > 0 ? <ArrowUp size={12} /> : delta < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
          {pct}% vs yesterday
        </div>
      )}
    </div>
  );
}

function LeadFunnel({ summary }: { summary: DashboardSummary }) {
  const stages = [
    { label: 'New', value: summary.newLeads, color: 'bg-blue-500', pct: 100 },
    { label: 'Contacted', value: summary.contacted, color: 'bg-amber-500', pct: summary.newLeads ? (summary.contacted / summary.newLeads) * 100 : 0 },
    { label: 'Qualified', value: summary.qualified, color: 'bg-purple-500', pct: summary.newLeads ? (summary.qualified / summary.newLeads) * 100 : 0 },
    { label: 'Won', value: summary.won, color: 'bg-green-500', pct: summary.newLeads ? (summary.won / summary.newLeads) * 100 : 0 },
  ];

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Lead Funnel</h3>
      <div className="space-y-3">
        {stages.map(({ label, value, color, pct }) => (
          <div key={label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-400">{label}</span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-900">
              <div
                className={cn('h-full rounded-full transition-all duration-700', color)}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-400">Conversion Rate</span>
        <span className="font-bold text-green-600">
          {summary.totalLeads > 0
            ? ((summary.won / summary.totalLeads) * 100).toFixed(1)
            : '0.0'}%
        </span>
      </div>
    </div>
  );
}

function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Leads</h3>
        <Link href="/leads" className="text-green-600 text-xs font-medium hover:underline">
          View all
        </Link>
      </div>
      {leads.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No leads yet</div>
      ) : (
        <div className="space-y-3">
          {leads.slice(0, 5).map((lead) => {
            const status = STATUS_CONFIG[lead.status];
            return (
              <Link
                key={lead._id}
                href={`/leads/${lead._id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-50 transition-colors group"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-gray-900',
                    avatarColor(lead.name)
                  )}
                >
                  {getInitials(lead.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-400 truncate">{lead.interest || lead.phone}</p>
                </div>
                <span className={cn('badge', status.bg, status.color)}>{status.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  const upcoming = appointments
    .filter((a) => a.status === 'Booked')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
        <Link href="/appointments" className="text-green-600 text-xs font-medium hover:underline">
          View all
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No upcoming appointments</div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((apt) => {
            const lead = apt.leadId as import('@/types').Lead;
            const name = typeof lead === 'object' ? lead.name : 'Lead';
            return (
              <div
                key={apt._id}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border-2 border-green-500"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 border-2 border-gray-900 flex flex-col items-center justify-center flex-shrink-0">
                  <p className="text-green-700 text-[10px] font-bold leading-none">
                    {new Date(apt.date).toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                  </p>
                  <p className="text-green-700 text-sm font-bold">
                    {new Date(apt.date).getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {apt.time}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-white bg-green-500 border-2 border-gray-900 px-2 py-0.5 rounded-full">
                  Booked
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AIInsights({ leads }: { leads: Lead[] }) {
  const hot = leads.filter((l) => l.intentTag === 'hot');
  const warm = leads.filter((l) => l.intentTag === 'warm');
  const cold = leads.filter((l) => l.intentTag === 'cold');
  const scored = leads.filter((l) => l.intentTag);

  const topHot = [...hot]
    .sort((a, b) => (b.intentScore ?? 0) - (a.intentScore ?? 0))
    .slice(0, 4);

  const counts = [
    { label: 'Hot', value: hot.length, color: 'text-red-700 bg-red-100 border-2 border-gray-900' },
    { label: 'Warm', value: warm.length, color: 'text-amber-700 bg-amber-100 border-2 border-gray-900' },
    { label: 'Cold', value: cold.length, color: 'text-blue-700 bg-blue-100 border-2 border-gray-900' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0 border-2 border-gray-900 shadow-pop-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">AI Insights</h3>
        </div>
        <Link href="/leads" className="text-green-600 text-xs font-medium hover:underline">
          View all
        </Link>
      </div>

      {scored.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          AI lead scoring will appear here once leads start replying on WhatsApp
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            {counts.map(({ label, value, color }) => (
              <span key={label} className={cn('flex-1 text-center py-2 rounded-xl text-sm font-semibold', color)}>
                {value}
                <span className="block text-[10px] font-medium opacity-80">{label}</span>
              </span>
            ))}
          </div>

          {topHot.length > 0 && (
            <div className="space-y-2">
              {topHot.map((lead, i) => (
                <Reveal key={lead._id} index={i}>
                  <Link
                    href={`/leads/${lead._id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-50 transition-colors"
                  >
                    <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-xs text-gray-400 truncate">{lead.interest || lead.phone}</p>
                    </div>
                    {lead.intentScore != null && (
                      <span className="text-xs font-bold text-red-600 tabular-nums">{lead.intentScore}</span>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecentInbox({ inbox }: { inbox: InboxItem[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Conversations</h3>
        <Link href="/inbox" className="text-green-600 text-xs font-medium hover:underline">
          Open Inbox
        </Link>
      </div>
      {inbox.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No conversations yet</div>
      ) : (
        <div className="space-y-2">
          {inbox.slice(0, 5).map((item) => (
            <Link
              key={item.phone}
              href="/inbox"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-50 transition-colors"
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2 border-gray-900',
                  avatarColor(item.leadName || item.phone)
                )}
              >
                {getInitials(item.leadName || item.phone)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.leadName || item.phone}
                </p>
                <p className="text-xs text-gray-400 truncate">{item.lastMessage}</p>
              </div>
              <p className="text-[10px] text-gray-400 flex-shrink-0">
                {formatRelativeTime(item.lastMessageTime)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { activeBusiness, isLoading: bizLoading } = useBusiness();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    const bId = activeBusiness._id;
    setLoading(true);
    Promise.all([
      api.getDashboardSummary(bId),
      api.getLeads(bId),
      api.getAppointments(bId),
      api.getInbox(bId),
    ])
      .then(([s, l, a, i]) => {
        setSummary(s);
        setLeads(l);
        setAppointments(a);
        setInbox(i);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  if (bizLoading || loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-gray-900 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No business set up yet</h2>
          <p className="text-gray-400 mb-4">
            Go to Settings to create your first business profile.
          </p>
          <Link href="/settings" className="btn-primary inline-flex">
            Setup Business
          </Link>
        </div>
      </div>
    );
  }

  const s = summary || {
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0,
    totalAppointments: 0,
  };

  const conversionRate =
    s.totalLeads > 0 ? ((s.won / s.totalLeads) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 relative overflow-hidden border-2 border-gray-900 shadow-pop">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">
              {activeBusiness.businessName}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {activeBusiness.industry} · WhatsApp: {activeBusiness.whatsappNumber}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/leads" className="btn-primary text-sm">
              <UserPlus size={14} /> Add Lead
            </Link>
            <Link href="/inbox" className="btn-secondary text-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Phone size={14} /> Open Inbox
            </Link>
          </div>
        </div>
      </div>

      {/* Lead Velocity */}
      <LeadVelocityBar leads={leads} />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            title: 'Total Leads', value: s.totalLeads, icon: Users,
            gradient: 'bg-blue-500', iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600', href: '/leads',
          },
          {
            title: 'New Leads', value: s.newLeads, icon: UserPlus,
            gradient: 'bg-green-500', iconBg: 'bg-gradient-to-br from-green-400 to-green-600', href: '/leads',
          },
          {
            title: 'Appointments', value: s.totalAppointments, icon: Calendar,
            gradient: 'bg-orange-500', iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600', href: '/appointments',
          },
          {
            title: 'Contacted', value: s.contacted, icon: Phone,
            gradient: 'bg-amber-500', iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
          },
          {
            title: 'Won Deals', value: s.won, icon: Trophy,
            gradient: 'bg-emerald-500', iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
          },
          {
            title: 'Conversion', value: conversionRate, icon: TrendingUp,
            gradient: 'bg-purple-500', iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
          },
        ].map((kpi, i) => (
          <Reveal key={kpi.title} index={i}>
            <StatCard {...kpi} />
          </Reveal>
        ))}
      </div>

      {/* Lost quick alert */}
      {s.lost > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">
            <strong>{s.lost} leads</strong> have been marked as Lost. Review and re-engage
            where possible.
          </p>
          <Link href="/leads" className="ml-auto text-red-600 text-xs font-semibold hover:underline flex-shrink-0">
            Review →
          </Link>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          <LeadFunnel key="funnel" summary={s} />,
          <RecentLeads key="leads" leads={leads} />,
          <UpcomingAppointments key="appointments" appointments={appointments} />,
        ].map((node, i) => (
          <Reveal key={node.key} index={i}>
            {node}
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          <AIInsights key="insights" leads={leads} />,
          <RecentInbox key="inbox" inbox={inbox} />,
        ].map((node, i) => (
          <Reveal key={node.key} index={i}>
            {node}
          </Reveal>
        ))}

        {/* Quick Actions */}
        <Reveal index={2}>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/leads', icon: UserPlus, label: 'Add Lead', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { href: '/inbox', icon: MessageSquare, label: 'Open Inbox', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { href: '/appointments', icon: Calendar, label: 'Book Appointment', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
                { href: '/knowledge-base', icon: TrendingUp, label: 'Update AI', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center border-2 border-gray-900',
                    color
                  )}
                >
                  <Icon size={22} />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
