'use client';

import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { WhatsAppTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  businessId: string;
  leadIds: string[];
  onClose: () => void;
  onSent: () => void;
}

export function BroadcastModal({ businessId, leadIds, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedName, setSelectedName] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getBusiness(businessId)
      .then((biz) => setTemplates(biz.whatsappTemplates || []))
      .catch(() => setError('Failed to load templates'))
      .finally(() => setTemplatesLoading(false));
  }, [businessId]);

  const selectedTemplate = templates.find((t) => t.name === selectedName);

  useEffect(() => {
    setVariables(Array(selectedTemplate?.variableCount || 0).fill(''));
  }, [selectedTemplate]);

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    setError('');
    try {
      await api.createCampaign({
        businessId,
        templateName: selectedTemplate.name,
        language: selectedTemplate.language,
        leadIds,
        variables: variables.filter((v) => v.trim()),
      });
      onSent();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            Send Broadcast to {leadIds.length} lead{leadIds.length > 1 ? 's' : ''}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {templatesLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No templates registered yet. Go to Settings → Templates to register one first.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template</label>
                <select
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="input"
                >
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>

              {selectedTemplate?.bodyPreview && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                  {selectedTemplate.bodyPreview}
                </div>
              )}

              {variables.map((v, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Variable {`{{${i + 1}}}`}
                  </label>
                  <input
                    value={v}
                    onChange={(e) =>
                      setVariables((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
                    }
                    className="input"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTemplate || sending}
            className={cn(
              'btn-primary',
              (!selectedTemplate || sending) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send size={15} /> Send Broadcast</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
