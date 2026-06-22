'use client';

import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Lead, Appointment, DashboardSummary } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Calendar,
  Trophy,
  Target,
  Clock,
} from 'lucide-react';
import { cn, STATUS_CONFIG } from '@/lib/utils';

const STATUS_COLORS_CHART: Record<string, string> = {
  'New Lead': '#3b82f6',
  'Contacted': '#f59e0b',
  'Qualified': '#8b5cf6',
  'Appointment Booked': '#f97316',
  'Won': '#22c55e',
  'Lost': '#ef4444',
};

function groupByMonth(items: { createdAt: string }[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const key = months[d.getMonth()];
    counts[key] = (counts[key] || 0) + 1;
  });
  const currentMonth = new Date().getMonth();
  return months.slice(0, currentMonth + 1).map((m) => ({
    month: m,
    count: counts[m] || 0,
  }));
}

export default function AnalyticsPage() {
  const { activeBusiness } = useBusiness();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    Promise.all([
      api.getLeads(activeBusiness._id),
      api.getAppointments(activeBusiness._id),
      api.getDashboardSummary(activeBusiness._id),
    ])
      .then(([l, a, s]) => {
        setLeads(l);
        setAppointments(a);
        setSummary(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = summary || {
    totalLeads: 0, newLeads: 0, contacted: 0, qualified: 0,
    won: 0, lost: 0, totalAppointments: 0,
  };

  const convRate = s.totalLeads > 0 ? ((s.won / s.totalLeads) * 100).toFixed(1) : '0.0';
  const aptRate = s.totalLeads > 0
    ? (((s.totalAppointments) / s.totalLeads) * 100).toFixed(1)
    : '0.0';

  // Status distribution for pie chart
  const statusData = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    name: cfg.label,
    value: leads.filter((l) => l.status === status).length,
    color: STATUS_COLORS_CHART[status],
  })).filter((d) => d.value > 0);

  // Lead source distribution
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    count,
  }));

  // Monthly leads
  const monthlyLeads = groupByMonth(leads);

  // Monthly appointments
  const monthlyApts = groupByMonth(appointments.map((a) => ({
    createdAt: a.date + 'T00:00:00Z',
  })));

  const combinedMonthly = monthlyLeads.map((m) => ({
    month: m.month,
    leads: m.count,
    appointments: monthlyApts.find((a) => a.month === m.month)?.count || 0,
  }));

  // Weekly activity computed from real lead data (current week)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyLeadCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  leads.forEach((l) => {
    const d = new Date(l.createdAt);
    if (d >= startOfWeek) {
      weeklyLeadCounts[d.getDay()] = (weeklyLeadCounts[d.getDay()] || 0) + 1;
    }
  });

  const weeklyAptCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  appointments.forEach((a) => {
    const d = new Date(a.date);
    if (d >= startOfWeek) {
      weeklyAptCounts[d.getDay()] = (weeklyAptCounts[d.getDay()] || 0) + 1;
    }
  });

  const weeklyActivity = dayLabels.map((day, i) => ({
    day,
    leads: weeklyLeadCounts[i] || 0,
    appointments: weeklyAptCounts[i] || 0,
  }));

  const kpis = [
    {
      label: 'Total Leads',
      value: s.totalLeads,
      icon: Users,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      sub: `${s.newLeads} new this period`,
    },
    {
      label: 'Conversion Rate',
      value: convRate + '%',
      icon: Target,
      color: 'bg-gradient-to-br from-green-400 to-green-600',
      sub: `${s.won} deals won`,
    },
    {
      label: 'Appointment Rate',
      value: aptRate + '%',
      icon: Calendar,
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      sub: `${s.totalAppointments} total booked`,
    },
    {
      label: 'Won Deals',
      value: s.won,
      icon: Trophy,
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      sub: `${s.lost} lost`,
    },
  ];

  return (
    <div className="page-container">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="stat-card">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-100">{value}</p>
            <p className="text-gray-400 text-sm mt-0.5">{label}</p>
            <p className="text-xs text-gray-500 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Leads & Appointments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-100">Leads & Appointments</h3>
            <span className="text-xs text-gray-400">This year</span>
          </div>
          {combinedMonthly.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={combinedMonthly}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', background: '#11151f', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2.5} fill="url(#leadsGrad)" name="Leads" dot={{ r: 3, fill: '#22c55e' }} />
                <Area type="monotone" dataKey="appointments" stroke="#f97316" strokeWidth={2.5} fill="url(#aptsGrad)" name="Appointments" dot={{ r: 3, fill: '#f97316' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-100">Lead Status Distribution</h3>
            <span className="text-xs text-gray-400">{leads.length} total</span>
          </div>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No leads data yet
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', background: '#11151f', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-400">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-200">{value}</span>
                      <span className="text-[10px] text-gray-400">
                        ({leads.length > 0 ? ((value / leads.length) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lead Sources */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-100">Lead Sources</h3>
          </div>
          {sourceData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No source data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sourceData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', background: '#11151f', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-100">This Week&apos;s Activity</h3>
            <span className="text-xs text-gray-400">Current week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyActivity} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', background: '#11151f', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} name="New Leads" />
              <Bar dataKey="appointments" fill="#f97316" radius={[4, 4, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            label: 'Win Rate',
            value: s.totalLeads > 0 ? ((s.won / s.totalLeads) * 100).toFixed(1) + '%' : '—',
            sub: `${s.won} won out of ${s.totalLeads}`,
            color: 'text-green-300 bg-green-500/10 border border-green-500/20',
          },
          {
            icon: Clock,
            label: 'Avg. Appointment Rate',
            value: aptRate + '%',
            sub: `${s.totalAppointments} appointments from ${s.totalLeads} leads`,
            color: 'text-orange-300 bg-orange-500/10 border border-orange-500/20',
          },
          {
            icon: Target,
            label: 'Active Pipeline',
            value: s.contacted + s.qualified,
            sub: `${s.contacted} contacted + ${s.qualified} qualified`,
            color: 'text-purple-300 bg-purple-500/10 border border-purple-500/20',
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{label}</p>
              <p className="text-2xl font-bold text-gray-100 my-0.5">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
