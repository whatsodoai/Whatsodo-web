'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Lead, LeadStatus, Message, Appointment } from '@/types';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  FileText,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  cn,
  STATUS_CONFIG,
  LEAD_STATUSES,
  formatDate,
  formatTime,
  getInitials,
  avatarColor,
} from '@/lib/utils';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeBusiness } = useBusiness();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', interest: '', notes: '' });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!activeBusiness || !id) return;
    setLoading(true);
    Promise.all([
      api.getLeads(activeBusiness._id),
      api.getAppointments(activeBusiness._id),
    ])
      .then(([leads, apts]) => {
        const found = leads.find((l) => l._id === id);
        if (found) {
          setLead(found);
          api.getMessages(activeBusiness._id, found.phone).then(setMessages).catch(() => {});
        }
        setAppointments(apts.filter((a) => {
          const leadId = typeof a.leadId === 'object' ? a.leadId._id : a.leadId;
          return leadId === id;
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeBusiness, id]);

  const openEdit = () => {
    if (!lead) return;
    setEditForm({ name: lead.name, email: lead.email || '', interest: lead.interest || '', notes: lead.notes || '' });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!lead) return;
    setEditSaving(true);
    try {
      const updated = await api.updateLead(lead._id, editForm);
      setLead({ ...lead, ...updated });
      setEditOpen(false);
    } catch { /* noop */ } finally {
      setEditSaving(false);
    }
  };

  const handleStatusChange = async (status: LeadStatus) => {
    if (!lead) return;
    try {
      await api.updateLeadStatus(lead._id, status);
      setLead({ ...lead, status });
      setStatusOpen(false);
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 w-32 skeleton rounded-lg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 skeleton rounded-2xl" />
          <div className="lg:col-span-2 h-96 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Lead not found.</p>
        <Link href="/leads" className="btn-primary inline-flex mt-4">
          Back to Leads
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[lead.status];
  const leadAppointments = appointments;

  return (
    <div className="page-container">
      <Link
        href="/leads"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 w-fit"
      >
        <ArrowLeft size={15} /> Back to Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-end mb-2">
              <button onClick={openEdit} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
                <Edit2 size={12} /> Edit
              </button>
            </div>
            <div className="flex flex-col items-center text-center mb-5">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-3',
                  avatarColor(lead.name)
                )}
              >
                {getInitials(lead.name)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{lead.phone}</p>
              <div className="mt-3 relative">
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-gray-900',
                    cfg.bg,
                    cfg.color
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  {lead.status}
                  <ChevronDown size={13} className={cn(statusOpen && 'rotate-180')} />
                </button>
                {statusOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white border-2 border-gray-900 rounded-xl shadow-pop z-10 py-1 min-w-[180px]">
                    {LEAD_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          'w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-2.5',
                          lead.status === s && 'bg-gray-100 font-medium'
                        )}
                      >
                        <span
                          className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_CONFIG[s].dot)}
                        />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { icon: Phone, label: 'Phone', value: lead.phone, href: `tel:${lead.phone}` },
                { icon: Mail, label: 'Email', value: lead.email || '—', href: lead.email ? `mailto:${lead.email}` : undefined },
                { icon: Tag, label: 'Interest', value: lead.interest || '—' },
                { icon: FileText, label: 'Source', value: lead.source },
                { icon: Clock, label: 'Added', value: formatDate(lead.createdAt) },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    {href ? (
                      <a href={href} className="text-gray-900 font-medium hover:text-green-600">
                        {value}
                      </a>
                    ) : (
                      <p className="text-gray-900 font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {lead.notes && (
              <div className="mt-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                <p className="text-sm text-amber-800">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Actions
            </p>
            <div className="space-y-2">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Phone size={15} /> Call {lead.name}
              </a>
              <Link
                href="/inbox"
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <MessageSquare size={15} /> Open Chat
              </Link>
              <Link
                href="/appointments"
                className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                <Calendar size={15} /> Book Appointment
              </Link>
            </div>
          </div>

          {/* Appointments */}
          {leadAppointments.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Appointments
              </p>
              <div className="space-y-2">
                {leadAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="p-3 rounded-xl border-2 border-gray-900 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(apt.date)}
                      </p>
                      <span className="text-xs text-green-600 font-medium">{apt.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{apt.time}</p>
                    {apt.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{apt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversation History */}
        <div className="lg:col-span-2 card flex flex-col" style={{ maxHeight: '75vh' }}>
          <div className="p-5 border-b-2 border-gray-900 flex items-center gap-3">
            <MessageSquare size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Conversation History</h3>
            <span className="ml-auto text-xs text-gray-400">{messages.length} messages</span>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div>
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversation history yet</p>
                <p className="text-gray-300 text-xs mt-1">
                  Messages will appear here once the lead interacts via WhatsApp
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={cn(
                    'flex',
                    msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-sm px-4 py-2.5',
                      msg.direction === 'outgoing'
                        ? 'chat-bubble-out text-white'
                        : 'chat-bubble-in text-gray-900 border-2 border-gray-900'
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={cn(
                        'text-[10px] mt-1 text-right',
                        msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Lead Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-gray-900 rounded-2xl w-full max-w-md shadow-pop-lg animate-bounce-in">
            <div className="flex items-center justify-between p-5 border-b-2 border-gray-900">
              <h2 className="text-lg font-bold text-gray-900">Edit Lead</h2>
              <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
                { label: 'Interest', key: 'interest', type: 'text', placeholder: 'What are they interested in?' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="input"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Internal notes about this lead..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditOpen(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className={cn('btn-primary flex-1 justify-center gap-2', editSaving && 'opacity-70')}
                >
                  {editSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={14} /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
