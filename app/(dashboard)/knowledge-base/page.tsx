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
  FileText,
  Globe,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'company' | 'services' | 'faqs' | 'sales' | 'objections' | 'train';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Company Info', icon: BookOpen },
  { id: 'services', label: 'Services', icon: Tag },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'sales', label: 'Sales Config', icon: Megaphone },
  { id: 'objections', label: 'Objections', icon: AlertTriangle },
  { id: 'train', label: 'Train AI', icon: Sparkles },
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
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Train AI tab state
  const [trainMode, setTrainMode] = useState<'pdf' | 'website'>('pdf');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [extractedTitle, setExtractedTitle] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [mergeTarget, setMergeTarget] = useState<'description' | 'instructions' | null>(null);

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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setExtracting(true);
    setExtractError('');
    setExtractedText('');
    try {
      const result = await api.extractPdf(file);
      setExtractedText(result.text);
      setExtractedTitle(`PDF: ${file.name} (${result.pages} pages)`);
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract PDF text');
    } finally {
      setExtracting(false);
    }
  };

  const handleWebsiteScrape = async () => {
    if (!websiteUrl.trim()) return;
    setExtracting(true);
    setExtractError('');
    setExtractedText('');
    try {
      const result = await api.extractWebsite(websiteUrl.trim());
      setExtractedText(result.text);
      setExtractedTitle(result.title || websiteUrl.trim());
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract website content');
    } finally {
      setExtracting(false);
    }
  };

  const handleMergeExtracted = (target: 'description' | 'instructions') => {
    if (!extractedText) return;
    if (target === 'description') {
      updateKb('companyDescription', (kb.companyDescription ? kb.companyDescription + '\n\n' : '') + extractedText.slice(0, 3000));
    } else {
      updateKb('salesInstructions', (kb.salesInstructions ? kb.salesInstructions + '\n\n' : '') + extractedText.slice(0, 2000));
    }
    setMergeTarget(target);
    setTimeout(() => setMergeTarget(null), 2000);
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
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
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
        <div className="flex items-center gap-2.5 p-4 bg-red-50 rounded-xl text-red-600 text-sm">
          <AlertTriangle size={16} />
          {importError}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 p-4 bg-green-50 rounded-xl text-green-700 text-sm">
          <CheckCircle size={16} />
          Knowledge base updated successfully. Your AI will use this information.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-soft">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700">Services Offered</label>
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {(kb.services || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
                    No services added. Click &quot;Add Service&quot; to start.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Offers</label>
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                <p className="text-sm text-gray-400">
                  Common questions your AI will answer automatically
                </p>
              </div>
              <button onClick={addFaq} className="btn-secondary text-xs py-1.5">
                <Plus size={13} /> Add FAQ
              </button>
            </div>
            <div className="space-y-4">
              {(kb.faqs || []).map((faq, i) => (
                <div key={i} className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 relative">
                  <button
                    onClick={() => removeFaq(i)}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="space-y-2.5 pr-8">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Question</label>
                      <input
                        value={faq.question}
                        onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        className="input"
                        placeholder="e.g. What are your prices?"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Answer</label>
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
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700">
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700">
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                <p className="text-sm text-gray-400">
                  How the AI responds to common customer objections
                </p>
              </div>
              <button onClick={addObjection} className="btn-secondary text-xs py-1.5">
                <Plus size={13} /> Add Objection
              </button>
            </div>
            <div className="space-y-4">
              {(kb.objectionHandling || []).map((obj, i) => (
                <div key={i} className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 relative">
                  <button
                    onClick={() => removeObjection(i)}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="space-y-2.5 pr-8">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
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
                      <label className="block text-xs font-medium text-gray-400 mb-1">
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
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
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
            <h3 className="font-semibold text-gray-900">Test Your AI Agent</h3>
            <p className="text-xs text-gray-500">Send a sample WhatsApp message and see how your AI replies</p>
          </div>
        </div>

        {/* Chat history */}
        {testHistory.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 max-h-72 overflow-y-auto border border-gray-100">
            {testHistory.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                  msg.role === 'user'
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'
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
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
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
            className="mt-2 text-xs text-gray-400 hover:text-gray-700"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Train AI tab */}
      {activeTab === 'train' && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Train AI from Documents</h3>
            <p className="text-sm text-gray-500">
              Extract content from a PDF or website and merge it into your knowledge base.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => { setTrainMode('pdf'); setExtractedText(''); setExtractError(''); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                trainMode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <FileText size={14} /> PDF Upload
            </button>
            <button
              onClick={() => { setTrainMode('website'); setExtractedText(''); setExtractError(''); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                trainMode === 'website' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Globe size={14} /> Website URL
            </button>
          </div>

          {/* PDF upload */}
          {trainMode === 'pdf' && (
            <div>
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={extracting}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
              >
                {extracting ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <FileText className="w-8 h-8 text-gray-400" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {extracting ? 'Extracting text…' : 'Click to upload PDF'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports PDF files up to 20MB</p>
                </div>
              </button>
            </div>
          )}

          {/* Website URL */}
          {trainMode === 'website' && (
            <div className="flex gap-2">
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWebsiteScrape()}
                placeholder="https://yourbusiness.com/about"
                className="input flex-1"
                disabled={extracting}
              />
              <button
                onClick={handleWebsiteScrape}
                disabled={extracting || !websiteUrl.trim()}
                className={cn('btn-primary', (extracting || !websiteUrl.trim()) && 'opacity-50')}
              >
                {extracting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Globe size={15} />
                )}
              </button>
            </div>
          )}

          {extractError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle size={14} />
              {extractError}
            </div>
          )}

          {/* Extracted text preview */}
          {extractedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{extractedTitle}</p>
                <button onClick={() => setExtractedText('')} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {extractedText.slice(0, 1500)}{extractedText.length > 1500 ? '…' : ''}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {extractedText.length.toLocaleString()} characters extracted. Merge into your knowledge base:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMergeExtracted('description')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
                    mergeTarget === 'description'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <CheckCircle size={13} className={mergeTarget === 'description' ? 'text-green-500' : 'text-gray-400'} />
                  {mergeTarget === 'description' ? 'Merged!' : 'Add to Company Description'}
                </button>
                <button
                  onClick={() => handleMergeExtracted('instructions')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
                    mergeTarget === 'instructions'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <CheckCircle size={13} className={mergeTarget === 'instructions' ? 'text-green-500' : 'text-gray-400'} />
                  {mergeTarget === 'instructions' ? 'Merged!' : 'Add to Sales Instructions'}
                </button>
              </div>
              <p className="text-xs text-gray-400">After merging, click "Save Changes" to apply to your AI.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
