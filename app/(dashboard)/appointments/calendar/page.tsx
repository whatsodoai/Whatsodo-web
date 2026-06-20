'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Appointment, Lead } from '@/types';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, Clock } from 'lucide-react';
import { cn, getInitials, avatarColor } from '@/lib/utils';
import { BookAppointmentModal } from '../book-appointment-modal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const { activeBusiness } = useBusiness();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

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

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const getAptForDate = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter((a) => a.date === dateStr);
  };

  const getLeadName = (apt: Appointment) => {
    if (typeof apt.leadId === 'object') return (apt.leadId as Lead).name;
    const lead = leads.find((l) => l._id === apt.leadId);
    return lead?.name || 'Unknown';
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedApts = selectedDate
    ? appointments.filter((a) => a.date === selectedDate)
    : [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <Link href="/appointments" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to List
        </Link>
        <button onClick={() => setShowBook(true)} className="btn-primary">
          <Plus size={15} /> Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayApts = getAptForDate(day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      'min-h-[64px] p-1.5 rounded-xl border transition-all text-left',
                      isSelected
                        ? 'bg-green-50 border-green-300 shadow-sm'
                        : isToday
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-semibold mb-1',
                        isToday
                          ? 'text-white'
                          : isSelected
                          ? 'text-green-700'
                          : 'text-gray-700'
                      )}
                    >
                      {day}
                    </p>
                    <div className="space-y-0.5">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt._id}
                          className={cn(
                            'text-[9px] font-medium px-1 py-0.5 rounded truncate',
                            apt.status === 'Booked'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {apt.time.split(' ')[0]}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <p className="text-[9px] text-gray-400 font-medium">
                          +{dayApts.length - 2} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
            {[
              { color: 'bg-green-400', label: 'Booked' },
              { color: 'bg-blue-400', label: 'Completed' },
              { color: 'bg-red-400', label: 'Cancelled' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Detail */}
        <div className="card p-5">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {selectedApts.length} appointment{selectedApts.length !== 1 ? 's' : ''}
              </p>
              {selectedApts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No appointments on this day</p>
                  <button
                    onClick={() => setShowBook(true)}
                    className="btn-primary inline-flex mt-3 text-xs"
                  >
                    <Plus size={13} /> Book here
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedApts.map((apt) => {
                    const name = getLeadName(apt);
                    const lead = typeof apt.leadId === 'object'
                      ? apt.leadId as Lead
                      : leads.find((l) => l._id === apt.leadId);
                    return (
                      <div
                        key={apt._id}
                        className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                              avatarColor(name)
                            )}
                          >
                            {getInitials(name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={10} /> {apt.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              apt.status === 'Booked'
                                ? 'bg-green-100 text-green-700'
                                : apt.status === 'Completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {apt.status}
                          </span>
                          {lead && (
                            <Link
                              href={`/leads/${lead._id}`}
                              className="text-xs text-green-600 hover:underline"
                            >
                              View Lead →
                            </Link>
                          )}
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2 truncate">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-400 text-sm font-medium">Select a date</p>
              <p className="text-gray-300 text-xs mt-1">
                Click on any date to see its appointments
              </p>
            </div>
          )}
        </div>
      </div>

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
