'use client';

import { useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Lead, LeadStatus } from '@/types';
import Link from 'next/link';
import {
  UserPlus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Send,
  X,
} from 'lucide-react';
import {
  cn,
  STATUS_CONFIG,
  LEAD_STATUSES,
  formatRelativeTime,
  getInitials,
  avatarColor,
} from '@/lib/utils';
import { AddLeadModal } from './add-lead-modal';
import { EditLeadModal } from './edit-lead-modal';
import { BroadcastModal } from './broadcast-modal';

const STATUS_COLUMNS: LeadStatus[] = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Appointment Booked',
  'Won',
  'Lost',
];

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('badge', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const INTENT_CONFIG: Record<'hot' | 'warm' | 'cold', { bg: string; color: string; label: string }> = {
  hot: { bg: 'bg-red-500/10', color: 'text-red-300', label: '🔥 Hot' },
  warm: { bg: 'bg-orange-500/10', color: 'text-orange-300', label: '☀️ Warm' },
  cold: { bg: 'bg-blue-500/10', color: 'text-blue-300', label: '❄️ Cold' },
};

function IntentBadge({ intentTag }: { intentTag?: 'hot' | 'warm' | 'cold' }) {
  if (!intentTag) return null;
  const cfg = INTENT_CONFIG[intentTag];
  return (
    <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5 inline-block', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

function TableView({
  leads,
  onStatusChange,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
}: {
  leads: Lead[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string, name: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-3.5 w-10" />
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                Lead
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden md:table-cell">
                Phone
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden lg:table-cell">
                Interest
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden xl:table-cell">
                Source
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden xl:table-cell">
                Added
              </th>
              <th className="px-4 py-3.5 w-28" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="table-row">
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead._id)}
                    onChange={() => onToggleSelect(lead._id)}
                    className="w-4 h-4 rounded border-white/20 accent-green-500 cursor-pointer"
                  />
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/leads/${lead._id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                        avatarColor(lead.name)
                      )}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-100">{lead.name}</p>
                        <IntentBadge intentTag={lead.intentTag} />
                      </div>
                      <p className="text-xs text-gray-500 md:hidden">{lead.phone}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-sm text-gray-300 hover:text-green-400 font-mono"
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <p className="text-sm text-gray-300 max-w-[180px] truncate">
                    {lead.interest || '—'}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  {/* Native select avoids overflow-x-auto clipping */}
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead._id, e.target.value as LeadStatus)}
                    className={cn(
                      'text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400',
                      STATUS_CONFIG[lead.status as LeadStatus]?.bg,
                      STATUS_CONFIG[lead.status as LeadStatus]?.color,
                    )}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {lead.source}
                  </span>
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-gray-500">
                  {formatRelativeTime(lead.createdAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href="/inbox"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                      title="Open chat"
                    >
                      <MessageSquare size={14} />
                    </Link>
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Call"
                    >
                      <Phone size={14} />
                    </a>
                    <button
                      onClick={() => onEdit(lead)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Edit lead"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(lead._id, lead.name)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete lead"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KanbanView({
  leads,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  leads: Lead[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const colLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
              <span className="text-sm font-semibold text-gray-300">{status}</span>
              <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {colLeads.length}
              </span>
            </div>
            <div className="space-y-2">
              {colLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3.5 border border-white/10 shadow-glass hover:shadow-glow transition-shadow"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                        avatarColor(lead.name)
                      )}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-100 truncate">{lead.name}</p>
                        <IntentBadge intentTag={lead.intentTag} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{lead.phone}</p>
                    </div>
                  </div>
                  {lead.interest && (
                    <p className="text-xs text-gray-400 bg-white/5 rounded-lg p-2 mb-2.5 line-clamp-2">
                      {lead.interest}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/leads/${lead._id}`}
                      className="flex-1 text-center text-xs text-gray-400 hover:text-gray-200 py-1 rounded-lg hover:bg-white/5"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => onEdit(lead)}
                      className="p-1 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(lead._id, lead.name)}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead._id, e.target.value as LeadStatus)}
                      className="text-xs border-0 bg-transparent text-gray-500 cursor-pointer focus:outline-none"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>→ {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {colLeads.length === 0 && (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-gray-600">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeadsPage() {
  const { activeBusiness } = useBusiness();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBroadcast, setShowBroadcast] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchLeads = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await api.getLeads(activeBusiness._id);
      setLeads(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const timer = setInterval(fetchLeads, 15000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness]);

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, status);
      setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status } : l)));
    } catch {
      //
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } catch {
      //
    }
  };

  const sources = ['All', ...Array.from(new Set(leads.map((l) => l.source).filter(Boolean)))];

  const filtered = leads.filter((l) => {
    const matchSearch =
      search === '' ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.interest || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchSource = sourceFilter === 'All' || l.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{leads.length} total leads</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <UserPlus size={15} /> Add Lead
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-surface-900 border border-white/10 text-gray-100 rounded-xl px-4 py-3">
          <span className="text-sm font-medium">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors"
            >
              <Send size={14} /> Send Broadcast
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...LEAD_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-white/15 text-gray-100'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              )}
            >
              {s === 'All' ? 'All' : STATUS_CONFIG[s].label}
              {s !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {leads.filter((l) => l.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {sources.length > 2 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-surface-900 text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            {sources.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>
            ))}
          </select>
        )}

        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setView('table')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'table' ? 'bg-white/15 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'kanban' ? 'bg-white/15 text-gray-100' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No leads found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your filters'
              : 'Add your first lead to get started'}
          </p>
        </div>
      ) : view === 'table' ? (
        <TableView
          leads={filtered}
          onStatusChange={handleStatusChange}
          onEdit={setEditingLead}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      ) : (
        <KanbanView
          leads={filtered}
          onStatusChange={handleStatusChange}
          onEdit={setEditingLead}
          onDelete={handleDelete}
        />
      )}

      {showAdd && (
        <AddLeadModal
          businessId={activeBusiness?._id || ''}
          onClose={() => setShowAdd(false)}
          onAdded={fetchLeads}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={fetchLeads}
        />
      )}

      {showBroadcast && activeBusiness && (
        <BroadcastModal
          businessId={activeBusiness._id}
          leadIds={Array.from(selectedIds)}
          onClose={() => setShowBroadcast(false)}
          onSent={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
