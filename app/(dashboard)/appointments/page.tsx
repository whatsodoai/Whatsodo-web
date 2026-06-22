'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Appointment, Lead } from '@/types';
import {
  Calendar,
  Plus,
  Clock,
  User,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import { cn, formatDate, getInitials, avatarColor } from '@/lib/utils';
import { BookAppointmentModal } from './book-appointment-modal';
import { Reveal } from '@/components/motion/reveal';

type AptStatus = 'All' | 'Booked' | 'Completed' | 'Cancelled';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Booked: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function AppointmentsPage() {
  const { activeBusiness } = useBusiness();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<AptStatus>('All');
  const [showBook, setShowBook] = useState(false);

  const fetchData = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const [apts, ls] = await Promise.all([
        api.getAppointments(activeBusiness._id),
        api.getLeads(activeBusiness._id),
      ]);
      setAppointments(apts);
      setLeads(ls);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness]);

  const handleStatusUpdate = async (id: string, status: 'Booked' | 'Completed' | 'Cancelled') => {
    try {
      await api.updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status } : a));
    } catch { /* noop */ }
  };

  const getLeadName = (apt: Appointment): string => {
    if (typeof apt.leadId === 'object') return (apt.leadId as Lead).name;
    const lead = leads.find((l) => l._id === apt.leadId);
    return lead?.name || 'Unknown';
  };

  const getLeadPhone = (apt: Appointment): string => {
    if (typeof apt.leadId === 'object') return (apt.leadId as Lead).phone;
    const lead = leads.find((l) => l._id === apt.leadId);
    return lead?.phone || '';
  };

  const filtered = appointments
    .filter((a) => statusFilter === 'All' || a.status === statusFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const today = new Date();
  const upcoming = filtered.filter(
    (a) => a.status === 'Booked' && new Date(a.date) >= today
  );
  const past = filtered.filter(
    (a) => a.status !== 'Booked' || new Date(a.date) < today
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {appointments.length} total · {upcoming.length} upcoming
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/appointments/calendar"
            className="btn-secondary"
          >
            <Calendar size={15} /> Calendar View
          </Link>
          <button onClick={() => setShowBook(true)} className="btn-primary">
            <Plus size={15} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {(['All', 'Booked', 'Completed', 'Cancelled'] as AptStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border-2',
              statusFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
            )}
          >
            {s}
            {s !== 'All' && (
              <span className="ml-1.5 opacity-60">
                {appointments.filter((a) => a.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No appointments found</p>
          <p className="text-gray-400 text-sm mt-1">
            Book your first appointment to get started
          </p>
          <button
            onClick={() => setShowBook(true)}
            className="btn-primary inline-flex mt-4 mx-auto"
          >
            <Plus size={15} /> Book Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-3">
                {upcoming.map((apt, i) => (
                  <Reveal key={apt._id} index={i}>
                    <AppointmentCard
                      apt={apt}
                      name={getLeadName(apt)}
                      phone={getLeadPhone(apt)}
                      leads={leads}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* Past / Completed / Cancelled */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Past ({past.length})
              </h3>
              <div className="space-y-3">
                {past.map((apt, i) => (
                  <Reveal key={apt._id} index={upcoming.length + i}>
                    <AppointmentCard
                      apt={apt}
                      name={getLeadName(apt)}
                      phone={getLeadPhone(apt)}
                      leads={leads}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showBook && (
        <BookAppointmentModal
          businessId={activeBusiness?._id || ''}
          leads={leads}
          onClose={() => setShowBook(false)}
          onBooked={fetchData}
        />
      )}
    </div>
  );
}

function AppointmentCard({
  apt,
  name,
  phone,
  leads,
  onStatusUpdate,
}: {
  apt: Appointment;
  name: string;
  phone: string;
  leads: Lead[];
  onStatusUpdate: (id: string, status: 'Booked' | 'Completed' | 'Cancelled') => void;
}) {
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_COLORS[apt.status] || STATUS_COLORS['Booked'];
  const aptDate = new Date(apt.date);
  const isToday = aptDate.toDateString() === new Date().toDateString();
  const isTomorrow =
    aptDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const lead = leads.find((l) => {
    if (typeof apt.leadId === 'object') return (apt.leadId as Lead)._id === l._id;
    return l._id === apt.leadId;
  });

  const handleUpdate = async (status: 'Booked' | 'Completed' | 'Cancelled') => {
    setUpdating(true);
    await onStatusUpdate(apt._id, status);
    setUpdating(false);
  };

  return (
    <div
      className={cn(
        'card p-4 flex items-center gap-4',
        apt.status === 'Booked' && 'border-l-4 border-l-green-500'
      )}
    >
      {/* Date block */}
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0',
          apt.status === 'Booked' ? 'bg-green-50' : 'bg-gray-50'
        )}
      >
        <p
          className={cn(
            'text-[10px] font-bold uppercase leading-none',
            apt.status === 'Booked' ? 'text-green-600' : 'text-gray-400'
          )}
        >
          {aptDate.toLocaleDateString('en', { month: 'short' })}
        </p>
        <p
          className={cn(
            'text-2xl font-bold leading-tight',
            apt.status === 'Booked' ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {aptDate.getDate()}
        </p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0',
              avatarColor(name)
            )}
          >
            {getInitials(name)}
          </div>
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          {isToday && (
            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              TODAY
            </span>
          )}
          {isTomorrow && (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              TOMORROW
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {apt.time}
          </span>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="text-gray-500 hover:text-blue-600 font-mono text-xs"
            >
              {phone}
            </a>
          )}
        </div>
        {apt.notes && (
          <p className="text-xs text-gray-400 mt-1 truncate">{apt.notes}</p>
        )}
      </div>

      {/* Status + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        <span className={cn('badge', cfg.bg, cfg.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {apt.status}
        </span>
        {apt.status === 'Booked' && (
          <>
            <button
              onClick={() => handleUpdate('Completed')}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle size={12} /> Complete
            </button>
            <button
              onClick={() => handleUpdate('Cancelled')}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={12} /> Cancel
            </button>
          </>
        )}
        {apt.status === 'Cancelled' && (
          <button
            onClick={() => handleUpdate('Booked')}
            disabled={updating}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Restore
          </button>
        )}
        {lead && (
          <Link
            href={`/leads/${lead._id}`}
            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <User size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
