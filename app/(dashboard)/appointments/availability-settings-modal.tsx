'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { Availability } from '@/types';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

interface DayConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

type DayMap = Record<string, DayConfig>;

function defaultConfig(): DayConfig {
  return { enabled: false, startTime: '09:00', endTime: '17:00', slotDuration: 60 };
}

interface Props {
  businessId: string;
  onClose: () => void;
}

export function AvailabilitySettingsModal({ businessId, onClose }: Props) {
  const [dayMap, setDayMap] = useState<DayMap>(() =>
    Object.fromEntries(DAYS.map((d) => [d, defaultConfig()]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const rows: Availability[] = await api.getAvailability(businessId);
        const next = { ...dayMap };
        rows.forEach((r) => {
          next[r.day] = {
            enabled: r.isAvailable,
            startTime: r.startTime,
            endTime: r.endTime,
            slotDuration: r.slotDuration || 60,
          };
        });
        setDayMap(next);
      } catch { /* first time, no data yet */ } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const update = (day: string, patch: Partial<DayConfig>) => {
    setDayMap((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    // Basic validation
    for (const day of DAYS) {
      const cfg = dayMap[day];
      if (!cfg.enabled) continue;
      if (cfg.startTime >= cfg.endTime) {
        setError(`${day}: End time must be after start time.`);
        return;
      }
    }

    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const day of DAYS) {
        const cfg = dayMap[day];
        if (cfg.enabled) {
          promises.push(
            api.createAvailability({
              businessId,
              day,
              startTime: cfg.startTime,
              endTime: cfg.endTime,
              isAvailable: true,
              slotDuration: cfg.slotDuration,
            })
          );
        } else {
          promises.push(api.deleteAvailability(businessId, day).catch(() => {}));
        }
      }
      await Promise.all(promises);
      setSuccess('Availability saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Availability Settings</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Set your working hours and appointment slot duration per day
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {DAYS.map((d) => <div key={d} className="h-16 skeleton rounded-xl" />)}
            </div>
          ) : (
            DAYS.map((day) => {
              const cfg = dayMap[day];
              return (
                <div
                  key={day}
                  className={cn(
                    'rounded-xl border-2 p-4 transition-colors',
                    cfg.enabled ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => update(day, { enabled: !cfg.enabled })}
                      className={cn(
                        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors',
                        cfg.enabled ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5',
                          cfg.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </button>

                    <span className={cn('w-24 text-sm font-semibold', cfg.enabled ? 'text-gray-900' : 'text-gray-400')}>
                      {day}
                    </span>

                    {cfg.enabled && (
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        {/* Start time */}
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400" />
                          <input
                            type="time"
                            value={cfg.startTime}
                            onChange={(e) => update(day, { startTime: e.target.value })}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-green-400"
                          />
                        </div>
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                          type="time"
                          value={cfg.endTime}
                          onChange={(e) => update(day, { endTime: e.target.value })}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-green-400"
                        />

                        {/* Slot duration */}
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">Slot:</span>
                          <select
                            value={cfg.slotDuration}
                            onChange={(e) => update(day, { slotDuration: Number(e.target.value) })}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-green-400 bg-white"
                          >
                            {DURATION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Slot count preview */}
                        <SlotCount start={cfg.startTime} end={cfg.endTime} duration={cfg.slotDuration} />
                      </div>
                    )}

                    {!cfg.enabled && (
                      <span className="text-xs text-gray-400 italic">Not available</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className={cn('btn-primary flex-1 justify-center', (saving || loading) && 'opacity-70')}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={14} /> Save Availability</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotCount({ start, end, duration }: { start: string; end: string; duration: number }) {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const s = toMin(start);
  const e = toMin(end);
  if (e <= s || duration <= 0) return null;
  const count = Math.floor((e - s) / duration);
  return (
    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
      {count} slot{count !== 1 ? 's' : ''}
    </span>
  );
}
