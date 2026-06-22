'use client';

import { useEffect, useRef, useState } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { KnowledgeBase } from '@/types';
import { downloadKbTemplate, parseKbWorkbook } from '@/lib/knowledge-base-excel';
import {
  BookOpen,
  Save,
  Plus,
  Trash2,
  Bot,
  HelpCircle,
  Tag,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Send,
  Zap,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'company' | 'services' | 'faqs' | 'sales' | 'objections';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Company Info', icon: BookOpen },
  { id: 'services', label: 'Services', icon: Tag },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'sales', label: 'Sales Config', icon: Megaphone },
  { id: 'objections', label: 'Objections', icon: AlertTriangle },
];

const TONE_OPTIONS = ['Professional', 'Friendly', 'Casual', 'Formal', 'Energetic'];

export default function KnowledgeBasePage() {
  const { activeBusiness } = useBusiness();
  const [kb, setKb] = useState<Partial<KnowledgeBase>>({
    companyName: '',
    companyDescription: '',
    services: [],
    faqs: [],
    salesInstructions: '',
    appointmentInstructions: '',
    tone: 'Professional',
    contactEmail: '',
    contactPhone: '',
    leadQualificationQuestions: [],
    callToActions: [],
    offers: [],
    objectionHandling: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [testMsg, setTestMsg] = useState('');
  const [testReply, setTestReply] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    api
      .getKnowledgeBase(activeBusiness._id)
      .then((data) => data && setKb(data))
      .catch(() => setKb((prev) => ({ ...prev, businessId: activeBusiness._id })))
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  const handleSave = async () => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      await api.createKnowledgeBase({
        ...kb,
        businessId: activeBusiness._id,
        companyName: kb.companyName || activeBusiness.businessName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const updateKb = (key: keyof KnowledgeBase, value: unknown) => {
    setKb((prev) => ({ ...prev, [key]: value }));
  };

  // Array helpers
  const addItem = (key: 'services' | 'callToActions' | 'offers' | 'leadQualificationQuestions') => {
    updateKb(key, [...(kb[key] || []), '']);
  };
  const updateItem = (
    key: 'services' | 'callToActions' | 'offers' | 'leadQualificationQuestions',
    idx: number,
    val: string
  ) => {
    const arr = [...(kb[key] || [])];
    arr[idx] = val;
    updateKb(key, arr);
  };
  const removeItem = (
    key: 'services' | 'callToActions' | 'offers' | 'leadQualificationQuestions',
    idx: number
  ) => {
    updateKb(key, (kb[key] || []).filter((_, i) => i !== idx));
  };

  const addFaq = () => updateKb('faqs', [...(kb.faqs || []), { question: '', answer: '' }]);
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    const faqs = [...(kb.faqs || [])];
    faqs[idx] = { ...faqs[idx], [field]: val };
    updateKb('faqs', faqs);
  };
  const removeFaq = (idx: number) => updateKb('faqs', (kb.faqs || []).filter((_, i) => i !== idx));

  const addObjection = () => updateKb('objectionHandling', [...(kb.objectionHandling || []), { objection: '', response: '' }]);
  const updateObjection = (idx: number, field: 'objection' | 'response', val: string) => {
    const arr = [...(kb.objectionHandling || [])];
    arr[idx] = { ...arr[idx], [field]: val };
    updateKb('objectionHandling', arr);
  };
  const removeObjection = (idx: number) => updateKb('objectionHandling', (kb.objectionHandling || []).filter((_, i) => i !== idx));

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    try {
      const parsed = await parseKbWorkbook(file);
      setKb((prev) => ({ ...prev, ...parsed }));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to read the Excel file.');
    }
  };

  const handleTestAI = async () => {
    if (!activeBusiness || !testMsg.trim()) return;
    const userText = testMsg.trim();
    setTestMsg('');
    setTestHistory((h) => [...h, { role: 'user', text: userText }]);
    setTestLoading(true);
    try {
      const reply = await api.aiChat(activeBusiness._id, userText);
      setTestReply(reply);
      setTestHistory((h) => [...h, { role: 'ai', text: reply }]);
    } catch {
      setTestHistory((h) => [...h, { role: 'ai', text: '⚠️ AI unavailable. Make sure your knowledge base is saved.' }]);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-10 w-64 skeleton rounded-xl mb-6" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Configure what your AI knows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadKbTemplate(kb)}
            className="btn-secondary text-xs py-2"
            title="Download an Excel template pre-filled with your current data, one sheet per tab"
          >
            <Download size={14} /> Download Template
          </button>
          <button onClick={handleImportClick} className="btn-secondary text-xs py-2">
            <Upload size={14} /> Upload Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn('btn-primary', saving && 'opacity-70')}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle size={15} className="text-green-200" /> Saved!</>
            ) : (
              <><Save size={15} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {importError && (
        <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
          <AlertTriangle size={16} />
          {importError}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm">
          <CheckCircle size={16} />
          Knowledge base updated successfully. Your AI will use this information.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-1 w-fit shadow-glass">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-white/15 text-gray-100 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {/* Company Info */}
        {activeTab === 'company' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Company Name
                </label>
                <input
                  value={kb.companyName || ''}
                  onChange={(e) => updateKb('companyName', e.target.value)}
                  className="input"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  AI Tone
                </label>
                <select
                  value={kb.tone || 'Professional'}
                  onChange={(e) => updateKb('tone', e.target.value)}
                  className="input"
                >
                  {TONE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Company Description
              </label>
              <textarea
                value={kb.companyDescription || ''}
                onChange={(e) => updateKb('companyDescription', e.target.value)}
                rows={4}
                className="input resize-none"
                placeholder="Describe what your company does, your mission, and key value propositions..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={kb.contactEmail || ''}
                  onChange={(e) => updateKb('contactEmail', e.target.value)}
                  className="input"
                  placeholder="hello@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Contact Phone
                </label>
                <input
                  value={kb.contactPhone || ''}
                  onChange={(e) => updateKb('contactPhone', e.target.value)}
                  className="input"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>
        )}

        {/* Services */}
        {activeTab === 'services' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Services Offered</label>
                  <p className="text-xs text-gray-400 mt-0.5">List your main services or products</p>
                </div>
                <button onClick={() => addItem('services')} className="btn-secondary text-xs py-1.5">
                  <Plus size={13} /> Add Service
                </button>
              </div>
              <div className="space-y-2">
                {(kb.services || []).map((service, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={service}
                      onChange={(e) => updateItem('services', i, e.target.value)}
                      className="input flex-1"
                      placeholder={`Service ${i + 1}, e.g. Logo Design`}
                    />
                    <button
                      onClick={() => removeItem('services', i)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {(kb.services || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                    No services added. Click &quot;Add Service&quot; to start.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Current Offers</label>
                  <p className="text-xs text-gray-400 mt-0.5">Promotions or discounts to mention</p>
                </div>
                <button onClick={() => addItem('offers')} className="btn-secondary text-xs py-1.5">
                  <Plus size={13} /> Add Offer
                </button>
              </div>
              <div className="space-y-2">
                {(kb.offers || []).map((offer, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={offer}
                      onChange={(e) => updateItem('offers', i, e.target.value)}
                      className="input flex-1"
                      placeholder="e.g. 20% off for new clients this month"
                    />
                    <button
                      onClick={() => removeItem('offers', i)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faqs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  Common questions your AI will answer automatically
                </p>
              </div>
              <button onClick={addFaq} className="btn-secondary text-xs py-1.5">
                <Plus size={13} /> Add FAQ
              </button>
            </div>
            <div className="space-y-4">
              {(kb.faqs || []).map((faq, i) => (
                <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5 relative">
                  <button
                    onClick={() => removeFaq(i)}
                    className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="space-y-2.5 pr-8">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                      <input
                        value={faq.question}
                        onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        className="input"
                        placeholder="e.g. What are your prices?"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                        className="input resize-none"
                        rows={2}
                        placeholder="e.g. Our prices start from ₹5,000 depending on the complexity..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(kb.faqs || []).length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                  No FAQs added yet. Add questions your customers frequently ask.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Config */}
        {activeTab === 'sales' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Sales Instructions
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Tell the AI how to handle sales conversations
              </p>
              <textarea
                value={kb.salesInstructions || ''}
                onChange={(e) => updateKb('salesInstructions', e.target.value)}
                rows={5}
                className="input resize-none"
                placeholder="e.g. Always qualify the lead by asking about their budget and timeline. Push for a consultation call if they seem interested..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Appointment Instructions
              </label>
              <p className="text-xs text-gray-400 mb-2">
                How should the AI book appointments?
              </p>
              <textarea
                value={kb.appointmentInstructions || ''}
                onChange={(e) => updateKb('appointmentInstructions', e.target.value)}
                rows={4}
                className="input resize-none"
                placeholder="e.g. Offer slots Monday-Friday 10 AM to 6 PM. Book a 30-minute discovery call for new leads..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Lead Qualification Questions
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Questions the AI asks to qualify leads
                  </p>
                </div>
                <button onClick={() => addItem('leadQualificationQuestions')} className="btn-secondary text-xs py-1.5">
                  <Plus size={13} /> Add Question
                </button>
              </div>
              <div className="space-y-2">
                {(kb.leadQualificationQuestions || []).map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={q}
                      onChange={(e) => updateItem('leadQualificationQuestions', i, e.target.value)}
                      className="input flex-1"
                      placeholder="e.g. What is your budget for this project?"
                    />
                    <button
                      onClick={() => removeItem('leadQualificationQuestions', i)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Call-to-Action Phrases
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    CTAs the AI appends to responses
                  </p>
                </div>
                <button onClick={() => addItem('callToActions')} className="btn-secondary text-xs py-1.5">
                  <Plus size={13} /> Add CTA
                </button>
              </div>
              <div className="space-y-2">
                {(kb.callToActions || []).map((cta, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={cta}
                      onChange={(e) => updateItem('callToActions', i, e.target.value)}
                      className="input flex-1"
                      placeholder="e.g. Book a free consultation today!"
                    />
                    <button
                      onClick={() => removeItem('callToActions', i)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Objection Handling */}
        {activeTab === 'objections' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  How the AI responds to common customer objections
                </p>
              </div>
              <button onClick={addObjection} className="btn-secondary text-xs py-1.5">
                <Plus size={13} /> Add Objection
              </button>
            </div>
            <div className="space-y-4">
              {(kb.objectionHandling || []).map((obj, i) => (
                <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5 relative">
                  <button
                    onClick={() => removeObjection(i)}
                    className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="space-y-2.5 pr-8">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Customer Objection
                      </label>
                      <input
                        value={obj.objection}
                        onChange={(e) => updateObjection(i, 'objection', e.target.value)}
                        className="input"
                        placeholder="e.g. It's too expensive"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        AI Response
                      </label>
                      <textarea
                        value={obj.response}
                        onChange={(e) => updateObjection(i, 'response', e.target.value)}
                        className="input resize-none"
                        rows={2}
                        placeholder="e.g. I understand your concern. We offer flexible payment plans and the value you get far exceeds the investment..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(kb.objectionHandling || []).length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                  No objection handlers yet. Add common customer objections.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Test Chat Widget */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">Test Your AI Agent</h3>
            <p className="text-xs text-gray-500">Send a sample WhatsApp message and see how your AI replies</p>
          </div>
        </div>

        {/* Chat history */}
        {testHistory.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3 max-h-72 overflow-y-auto">
            {testHistory.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                  msg.role === 'user'
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-surface-800 border border-white/10 text-gray-200 rounded-bl-sm shadow-sm'
                )}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bot size={11} className="text-purple-400" />
                      <span className="text-[10px] font-semibold text-purple-400">AI Agent</span>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-800 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTestAI(); } }}
            placeholder="E.g. What services do you offer? / How much does it cost?"
            className="input flex-1"
            disabled={testLoading}
          />
          <button
            onClick={handleTestAI}
            disabled={testLoading || !testMsg.trim()}
            className={cn('btn-primary px-4', (testLoading || !testMsg.trim()) && 'opacity-50')}
          >
            {testLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        {testHistory.length > 0 && (
          <button
            onClick={() => { setTestHistory([]); setTestReply(''); }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}
