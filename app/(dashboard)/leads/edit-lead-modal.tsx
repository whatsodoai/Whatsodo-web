'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}

export function EditLeadModal({ lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: lead.name,
    phone: lead.phone,
    email: lead.email || '',
    interest: lead.interest || '',
    source: lead.source || 'Manual',
    notes: lead.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.updateLead(lead._id, form);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-gray-100">Edit Lead</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input name="name" required value={form.name} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Phone <span className="text-red-400">*</span>
              </label>
              <input name="phone" required value={form.phone} onChange={handleChange} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Interest / Service Needed</label>
            <input name="interest" value={form.interest} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Source</label>
            <select name="source" value={form.source} onChange={handleChange} className="input">
              <option value="Manual">Manual</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
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
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
