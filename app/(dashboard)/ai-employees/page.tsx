'use client';

import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { AiEmployee } from '@/types';
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  X,
  Save,
  ChevronDown,
  Sparkles,
  Users2,
  Globe,
  Brain,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEPARTMENTS = [
  'Sales', 'Customer Support', 'HR', 'Finance',
  'Marketing', 'Operations', 'Customer Success',
];

const ROLES = [
  'AI Sales Executive', 'AI Receptionist', 'AI Customer Support Executive',
  'AI Course Counselor', 'AI Appointment Manager', 'AI HR Assistant',
  'AI Marketing Executive', 'AI Restaurant Assistant', 'AI Healthcare Assistant',
  'Custom Role',
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Arabic', 'Spanish', 'French', 'German',
];

const PERSONALITIES = [
  'Professional and friendly', 'Formal and precise', 'Warm and empathetic',
  'Energetic and enthusiastic', 'Calm and reassuring', 'Concise and direct',
];

const AVATARS = ['🤖', '👩‍💼', '👨‍💼', '💼', '🌟', '⚡', '🎯', '💡', '🏆', '🌐'];

const DEPARTMENT_COLORS: Record<string, string> = {
  Sales: 'bg-blue-500/15 text-blue-400',
  'Customer Support': 'bg-green-500/15 text-green-400',
  HR: 'bg-purple-500/15 text-purple-400',
  Finance: 'bg-amber-500/15 text-amber-400',
  Marketing: 'bg-pink-500/15 text-pink-400',
  Operations: 'bg-cyan-500/15 text-cyan-400',
  'Customer Success': 'bg-emerald-500/15 text-emerald-400',
};

const emptyEmployee = (): Partial<AiEmployee> => ({
  name: '',
  role: 'AI Sales Executive',
  department: 'Sales',
  personality: 'Professional and friendly',
  language: 'English',
  avatar: '🤖',
  responsibilities: [],
  workingInstructions: '',
  escalationRules: 'Escalate to a human agent when the customer requests it, expresses frustration, or asks about billing/refunds.',
  isActive: false,
});

function EmployeeModal({
  employee,
  businessId,
  onClose,
  onSaved,
}: {
  employee: Partial<AiEmployee> | null;
  businessId: string;
  onClose: () => void;
  onSaved: (emp: AiEmployee) => void;
}) {
  const isEdit = !!(employee as AiEmployee)?._id;
  const [form, setForm] = useState<Partial<AiEmployee>>(employee ?? emptyEmployee());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [respInput, setRespInput] = useState('');

  const set = (key: keyof AiEmployee, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const addResponsibility = () => {
    if (!respInput.trim()) return;
    set('responsibilities', [...(form.responsibilities || []), respInput.trim()]);
    setRespInput('');
  };

  const removeResponsibility = (i: number) => {
    set('responsibilities', (form.responsibilities || []).filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      let saved: AiEmployee;
      if (isEdit) {
        saved = await api.updateAiEmployee((employee as AiEmployee)._id, form);
      } else {
        saved = await api.createAiEmployee({ ...form, businessId });
      }
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit AI Employee' : 'Hire AI Employee'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Avatar + Name row */}
          <div className="flex items-start gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Avatar</label>
              <div className="flex flex-wrap gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    onClick={() => set('avatar', av)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-xl flex items-center justify-center border-2 transition-colors',
                      form.avatar === av ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'
                    )}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee Name *</label>
              <input
                value={form.name || ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Aria, Max, Priya"
                className="input w-full"
              />
            </div>
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
              <select className="input w-full" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
              <select className="input w-full" value={form.department} onChange={(e) => set('department', e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Personality + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Personality</label>
              <select className="input w-full" value={form.personality} onChange={(e) => set('personality', e.target.value)}>
                {PERSONALITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Language</label>
              <select className="input w-full" value={form.language} onChange={(e) => set('language', e.target.value)}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Responsibilities</label>
            <div className="flex gap-2 mb-2">
              <input
                value={respInput}
                onChange={(e) => setRespInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                placeholder="e.g. Answer pricing questions"
                className="input flex-1"
              />
              <button
                onClick={addResponsibility}
                className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            {(form.responsibilities || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(form.responsibilities || []).map((r, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {r}
                    <button onClick={() => removeResponsibility(i)} className="hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Working Instructions */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Working Instructions</label>
            <textarea
              value={form.workingInstructions || ''}
              onChange={(e) => set('workingInstructions', e.target.value)}
              placeholder="Specific instructions for how this AI employee should behave, what to say, what to avoid..."
              rows={4}
              className="input w-full resize-none"
            />
          </div>

          {/* Escalation Rules */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Escalation Rules</label>
            <textarea
              value={form.escalationRules || ''}
              onChange={(e) => set('escalationRules', e.target.value)}
              placeholder="When should this AI employee hand over to a human agent?"
              rows={3}
              className="input w-full resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Hire Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeCard({
  emp,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  emp: AiEmployee;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const deptColor = DEPARTMENT_COLORS[emp.department] || 'bg-gray-500/15 text-gray-400';

  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5 relative transition-all',
      emp.isActive ? 'border-green-300 shadow-md shadow-green-500/10' : 'border-gray-100 hover:border-gray-200'
    )}>
      {emp.isActive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600">Active</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
          {emp.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base">{emp.name}</h3>
          <p className="text-sm text-gray-500">{emp.role}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', deptColor)}>
              {emp.department}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Globe size={11} />
              {emp.language}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Brain size={11} />
              {emp.personality.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {emp.responsibilities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {emp.responsibilities.slice(0, 4).map((r, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-xs">{r}</span>
          ))}
          {emp.responsibilities.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-xs">
              +{emp.responsibilities.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <button
          onClick={onToggleActive}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            emp.isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          )}
        >
          {emp.isActive ? <PowerOff size={13} /> : <Power size={13} />}
          {emp.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AiEmployeesPage() {
  const { activeBusiness } = useBusiness();
  const [employees, setEmployees] = useState<AiEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AiEmployee> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const businessId = activeBusiness?._id || '';

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    api.listAiEmployees(businessId)
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  const openCreate = () => { setEditing(emptyEmployee()); setModalOpen(true); };
  const openEdit = (emp: AiEmployee) => { setEditing(emp); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSaved = (saved: AiEmployee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e._id === saved._id);
      return idx >= 0 ? prev.map((e) => (e._id === saved._id ? saved : e)) : [...prev, saved];
    });
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this AI employee?')) return;
    setDeleting(id);
    try {
      await api.deleteAiEmployee(id);
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (emp: AiEmployee) => {
    try {
      const updated = emp.isActive
        ? await api.deactivateAiEmployee(emp._id)
        : await api.activateAiEmployee(emp._id);
      setEmployees((prev) =>
        prev.map((e) => {
          if (emp.isActive) return e._id === emp._id ? updated : e;
          // activating deactivates all others
          return e._id === emp._id ? updated : { ...e, isActive: false };
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const active = employees.find((e) => e.isActive);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Hire and manage AI employees to handle customer conversations on WhatsApp.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Hire AI Employee
        </button>
      </div>

      {/* Active Banner */}
      {active && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
            {active.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              {active.name} is on duty
            </p>
            <p className="text-xs text-green-600">
              {active.role} · {active.department} · Handling all incoming WhatsApp messages
            </p>
          </div>
          <Sparkles className="ml-auto w-5 h-5 text-green-400" />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI employees yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Hire your first AI employee to start handling customer conversations automatically on WhatsApp.
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Hire Your First AI Employee
          </button>
        </div>
      )}

      {/* Employee Cards */}
      {!loading && employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp._id} className={deleting === emp._id ? 'opacity-50 pointer-events-none' : ''}>
              <EmployeeCard
                emp={emp}
                onEdit={() => openEdit(emp)}
                onDelete={() => handleDelete(emp._id)}
                onToggleActive={() => handleToggleActive(emp)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && editing && (
        <EmployeeModal
          employee={editing}
          businessId={businessId}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
