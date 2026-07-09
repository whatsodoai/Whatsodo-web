'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';
import { Appointment, Lead } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  appointment: Appointment;
  businessId: string;
  onClose: () => void;
  onRescheduled: (updated: Appointment) => void;
}

export function RescheduleModal({ appointment, businessId, onClose, onRescheduled }: Props) {
  const leadName =
    typeof appointment.leadId === 'object'
      ? (appointment.leadId as Lead).name
      : 'this appointment';

  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = async (d: string) => {
    if (!d) return;
    setSlotsLoading(true);
    setTime('');
    setError('');
    try {
      const data = await api.getSlots(businessId, d);
      // Always include the current slot so admin can keep same time
      const all = data.includes(appointment.time) || d !== appointment.date
        ? data
        : [appointment.time, ...data];
      setSlots(all);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => { fetchSlots(date); }, [date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) { setError('Please select a time slot'); return; }
    setLoading(true);
    setError('');
    try {
      const updated = await api.rescheduleAppointment(appointment._id, date, time);
      onRescheduled(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-green-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Reschedule Appointment</h2>
              <p className="text-xs text-gray-400">{leadName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Current slot info */}
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5 text-sm text-orange-700">
            Current: <strong>{appointment.date}</strong> at <strong>{appointment.time}</strong>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">New Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Available Slots</label>
              <button
                type="button"
                onClick={() => fetchSlots(date)}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
                No available slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { setTime(slot); setError(''); }}
                    className={cn(
                      'px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      time === slot
                        ? 'bg-green-500 text-white border-green-500'
                        : slot === appointment.time && date === appointment.date
                        ? 'bg-orange-50 text-orange-600 border-orange-300 hover:border-green-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:text-green-600'
                    )}
                  >
                    {slot}
                    {slot === appointment.time && date === appointment.date && (
                      <span className="block text-[9px] leading-none mt-0.5 opacity-70">current</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !time}
              className={cn('btn-primary flex-1 justify-center', (loading || !time) && 'opacity-60')}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
