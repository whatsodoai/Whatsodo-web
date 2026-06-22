'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { Campaign, WhatsAppTemplate } from '@/types';
import {
  Megaphone,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { cn, formatRelativeTime, LEAD_STATUSES } from '@/lib/utils';

const STATUS_BADGE: Record<Campaign['status'], { bg: string; color: string; label: string }> = {
  draft: { bg: 'bg-white/5', color: 'text-gray-400', label: 'Draft' },
  sending: { bg: 'bg-blue-500/10', color: 'text-blue-300', label: 'Sending' },
  completed: { bg: 'bg-green-500/10', color: 'text-green-300', label: 'Completed' },
  failed: { bg: 'bg-red-500/10', color: 'text-red-300', label: 'Failed' },
};

function NewCampaignModal({
  businessId,
  templates,
  onClose,
  onCreated,
}: {
  businessId: string;
  templates: WhatsAppTemplate[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [templateName, setTemplateName] = useState('');
  const [segmentType, setSegmentType] = useState<'status' | 'source' | 'intentTag'>('status');
  const [segmentValue, setSegmentValue] = useState<string>(LEAD_STATUSES[0]);
  const [variables, setVariables] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const selectedTemplate = templates.find((t) => t.name === templateName);

  useEffect(() => {
    setVariables(Array(selectedTemplate?.variableCount || 0).fill(''));
  }, [selectedTemplate]);

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    setError('');
    try {
      await api.createCampaign({
        businessId,
        templateName: selectedTemplate.name,
        language: selectedTemplate.language,
        filter: { [segmentType]: segmentValue },
        variables: variables.filter((v) => v.trim()),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-bold text-gray-100">New Broadcast Campaign</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">{error}</div>
          )}

          {templates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No templates registered yet. Go to Settings → Templates to register one first.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Template</label>
                <select value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="input">
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Send to leads where...</label>
                <div className="flex gap-2">
                  <select
                    value={segmentType}
                    onChange={(e) => {
                      const type = e.target.value as 'status' | 'source' | 'intentTag';
                      setSegmentType(type);
                      setSegmentValue(type === 'status' ? LEAD_STATUSES[0] : type === 'intentTag' ? 'hot' : '');
                    }}
                    className="input w-32"
                  >
                    <option value="status">Status</option>
                    <option value="intentTag">Intent</option>
                    <option value="source">Source</option>
                  </select>
                  {segmentType === 'status' && (
                    <select value={segmentValue} onChange={(e) => setSegmentValue(e.target.value)} className="input flex-1">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {segmentType === 'intentTag' && (
                    <select value={segmentValue} onChange={(e) => setSegmentValue(e.target.value)} className="input flex-1">
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  )}
                  {segmentType === 'source' && (
                    <input
                      value={segmentValue}
                      onChange={(e) => setSegmentValue(e.target.value)}
                      placeholder="e.g. WhatsApp"
                      className="input flex-1"
                    />
                  )}
                </div>
              </div>

              {selectedTemplate?.bodyPreview && (
                <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-300">{selectedTemplate.bodyPreview}</div>
              )}

              {variables.map((v, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Variable {`{{${i + 1}}}`}</label>
                  <input
                    value={v}
                    onChange={(e) => setVariables((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                    className="input"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || creating}
            className={cn('btn-primary', (!selectedTemplate || creating) && 'opacity-50 cursor-not-allowed')}
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /> Launch Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { activeBusiness } = useBusiness();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const [c, biz] = await Promise.all([
        api.getCampaigns(activeBusiness._id),
        api.getBusiness(activeBusiness._id),
      ]);
      setCampaigns(c);
      setTemplates(biz.whatsappTemplates || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No campaigns yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Broadcast a WhatsApp template to a segment of leads, or select leads on the Leads page.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-white/10">
          {campaigns.map((c) => {
            const badge = STATUS_BADGE[c.status];
            return (
              <div key={c._id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4.5 h-4.5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100">{c.templateName}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(c.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-400" /> {c.stats.sent} sent
                  </span>
                  {c.stats.failed > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle size={12} className="text-red-400" /> {c.stats.failed} failed
                    </span>
                  )}
                  <span>{c.stats.total} total</span>
                </div>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', badge.bg, badge.color)}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showNew && activeBusiness && (
        <NewCampaignModal
          businessId={activeBusiness._id}
          templates={templates}
          onClose={() => setShowNew(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
