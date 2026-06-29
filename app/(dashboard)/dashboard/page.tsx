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
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  ChevronDown,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn, formatRelativeTime, getInitials, avatarColor, STATUS_CONFIG } from '@/lib/utils';
import { Reveal } from '@/components/motion/reveal';

/** Buckets items into daily counts for the last `days` days (oldest → newest). */
function dailyBuckets(items: { createdAt: string }[], days: number): number[] {
  const buckets = new Array(days).fill(0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  for (const item of items) {
    const diffDays = Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / 86400000);
    const idx = days - 1 - diffDays;
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets;
}

/** 7-day sparkline + week-over-week % change, derived from a 14-day window. */
function weeklyTrend(items: { createdAt: string }[]): { trend: number[]; changePct: number } {
  const buckets = dailyBuckets(items, 14);
  const trend = buckets.slice(7);
  const thisWeek = trend.reduce((a, b) => a + b, 0);
  const lastWeek = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
  const changePct = lastWeek > 0
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    : thisWeek > 0 ? 100 : 0;
  return { trend, changePct };
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  trend: number[];
  changePct?: number;
  href?: string;
}

function StatCard({ title, value, icon: Icon, gradient, trend, changePct, href }: StatCardProps) {
  const gradientId = `spark-${title.replace(/\s+/g, '-')}`;
  const content = (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl p-5 shadow-soft-lg hover:-translate-y-0.5 hover:shadow-soft-xl transition-all duration-200',
      gradient
    )}>
      <div className="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-10 w-28 h-28 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <MoreHorizontal className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
      </div>
      <p className="relative text-white/75 text-xs font-medium">{title}</p>
      <p className="relative text-3xl font-extrabold text-white mt-1 mb-1.5 tracking-tight">{value}</p>
      {changePct !== undefined && (
        <p className={cn(
          'relative text-xs font-semibold flex items-center gap-1',
          changePct > 0 ? 'text-emerald-200' : changePct < 0 ? 'text-rose-200' : 'text-white/60'
        )}>
          {changePct > 0 ? <ArrowUp size={11} /> : changePct < 0 ? <ArrowDown size={11} /> : <Minus size={11} />}
          {Math.abs(changePct)}% vs last week
        </p>
      )}
      <div className="relative h-12 mt-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#ffffff" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {href && <Link href={href} className="absolute inset-0" aria-label={title} />}
    </div>
  );

  return content;
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

  const items = [
    { label: 'Today', value: todayCount, color: 'text-green-700 bg-green-100' },
    { label: 'Yesterday', value: yesterdayCount, color: 'text-blue-700 bg-blue-100' },
    { label: 'Last 7 Days', value: weekCount, color: 'text-purple-700 bg-purple-100' },
  ];

  return (
    <div className="card p-4 flex items-center gap-6 flex-wrap shadow-soft-lg border-gray-100/80">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-soft">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <p className="font-semibold text-gray-900 text-sm">Lead Velocity</p>
      </div>
      <div className="flex items-center gap-6 flex-1 flex-wrap">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn('text-xl font-bold tabular-nums px-3 py-1 rounded-lg', color)}>
              {value}
            </span>
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-soft hover:bg-gray-50 transition-colors">
        This Week <ChevronDown size={14} className="text-gray-400" />
      </button>
    </div>
  );
}

function LeadFunnel({ summary }: { summary: DashboardSummary }) {
  const stages = [
    { label: 'New', value: summary.newLeads, color: '#3b82f6', clip: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)' },
    { label: 'Contacted', value: summary.contacted, color: '#f59e0b', clip: 'polygon(12% 0%, 88% 0%, 72% 100%, 28% 100%)' },
    { label: 'Qualified', value: summary.qualified, color: '#a855f7', clip: 'polygon(28% 0%, 72% 0%, 50% 100%, 50% 100%)' },
    { label: 'Won', value: summary.won, color: '#22c55e', clip: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)' },
  ];

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Lead Funnel</h3>
      <div className="flex items-center gap-5">
        <div className="w-28 flex-shrink-0">
          {stages.map((s) => (
            <div key={s.label} className="h-9" style={{ backgroundColor: s.color, clipPath: s.clip }} />
          ))}
        </div>
        <div className="flex-1 space-y-3">
          {stages.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
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
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
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
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex flex-col items-center justify-center flex-shrink-0 shadow-soft">
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
                <span className="badge text-green-700 bg-green-100">
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
    { label: 'Hot', value: hot.length, color: 'text-red-700 bg-red-100' },
    { label: 'Warm', value: warm.length, color: 'text-amber-700 bg-amber-100' },
    { label: 'Cold', value: cold.length, color: 'text-blue-700 bg-blue-100' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-soft">
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
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
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
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
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

/** Decorative phone + chat-bubble illustration for the welcome banner — no external image assets. */
function BannerIllustration() {
  return (
    <div className="relative w-40 h-28 hidden lg:block flex-shrink-0">
      <div className="absolute right-6 top-0 w-20 h-28 rounded-[1.5rem] bg-gray-900 shadow-soft-xl flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
          <Phone className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="absolute left-0 top-2 w-9 h-9 rounded-xl bg-white shadow-soft flex items-center justify-center rotate-[-8deg]">
        <MessageSquare className="w-4 h-4 text-green-600" />
      </div>
      <div className="absolute right-0 bottom-2 w-9 h-9 rounded-xl bg-white shadow-soft flex items-center justify-center rotate-[8deg]">
        <MessageSquare className="w-4 h-4 text-green-600" />
      </div>
      <div className="absolute left-2 bottom-0 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
      </div>
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
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
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

  const leadsTrend = weeklyTrend(leads);
  const appointmentsTrend = weeklyTrend(appointments);
  const contactedTrend = weeklyTrend(leads.filter((l) => l.status !== 'New Lead'));
  const wonTrend = weeklyTrend(leads.filter((l) => l.status === 'Won'));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = activeBusiness.businessName.split(' ')[0];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 relative overflow-hidden border border-green-100">
        <div className="absolute inset-0 dot-pattern opacity-60" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-soft">
              {firstName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-gray-900 text-xl font-bold">
                  {greeting}, {firstName}
                </h2>
                <span className="text-xl">👋</span>
              </div>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                {activeBusiness.businessName}
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-gray-400">· {activeBusiness.industry} · WhatsApp: {activeBusiness.whatsappNumber}</span>
              </p>
            </div>
          </div>
          <BannerIllustration />
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link href="/leads" className="btn-primary text-sm">
              <UserPlus size={14} /> Add Lead
            </Link>
            <Link href="/inbox" className="btn-secondary text-sm">
              <Phone size={14} /> Open Inbox
            </Link>
          </div>
        </div>
      </div>

      {/* Lead Velocity */}
      <LeadVelocityBar leads={leads} />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Total Leads', value: s.totalLeads, icon: Users,
            gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', trend: leadsTrend.trend, changePct: leadsTrend.changePct,
            href: '/leads',
          },
          {
            title: 'New Leads', value: s.newLeads, icon: UserPlus,
            gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', trend: leadsTrend.trend, changePct: leadsTrend.changePct,
            href: '/leads',
          },
          {
            title: 'Appointments', value: s.totalAppointments, icon: Calendar,
            gradient: 'bg-gradient-to-br from-orange-500 to-red-500', trend: appointmentsTrend.trend, changePct: appointmentsTrend.changePct,
            href: '/appointments',
          },
          {
            title: 'Contacted', value: s.contacted, icon: Phone,
            gradient: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', trend: contactedTrend.trend, changePct: contactedTrend.changePct,
          },
          {
            title: 'Won Deals', value: s.won, icon: Trophy,
            gradient: 'bg-gradient-to-br from-teal-500 to-emerald-600', trend: wonTrend.trend, changePct: wonTrend.changePct,
          },
          {
            title: 'Conversion', value: conversionRate, icon: TrendingUp,
            gradient: 'bg-gradient-to-br from-pink-500 to-rose-600', trend: wonTrend.trend, changePct: wonTrend.changePct,
          },
        ].map((kpi, i) => (
          <Reveal key={kpi.title} index={i}>
            <StatCard {...kpi} />
          </Reveal>
        ))}
      </div>

      {/* Lost quick alert */}
      {s.lost > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
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
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center',
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
