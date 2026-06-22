'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  businessId: string;
  leads: Lead[];
  onClose: () => void;
  onBooked: () => void;
}

export function BookAppointmentModal({ businessId, leads, onClose, onBooked }: Props) {
  const [form, setForm] = useState({
    leadId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: '',
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = async (date: string) => {
    if (!businessId || !date) return;
    setSlotsLoading(true);
    setForm((f) => ({ ...f, time: '' }));
    try {
      const data = await api.getSlots(businessId, date);
      setSlots(data);
    } catch {
      setSlots([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '13:00', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00',
      ]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => { fetchSlots(form.date); }, [form.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId || !form.time) {
      setError('Please select a lead and time slot');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createAppointment({ businessId, ...form });
      onBooked();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-gray-100">Book Appointment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Select Lead <span className="text-red-400">*</span>
            </label>
            <select
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="input"
              required
            >
              <option value="">Choose a lead...</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} — {l.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-300">
                Available Slots <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => fetchSlots(form.date)}
                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/10 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No available slots for this date.</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm({ ...form, time: slot })}
                    className={cn(
                      'px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      form.time === slot
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-green-500/30 hover:text-green-400'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes for this appointment..."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn('btn-primary flex-1 justify-center', loading && 'opacity-70')}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
