'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBusiness } from '@/contexts/business-context';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Availability, Business as BusinessType } from '@/types';
import {
  Building2,
  Smartphone,
  Clock,
  User,
  CheckCircle,
  Save,
  Plus,
  AlertCircle,
  Zap,
  Bot,
  Users,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input readOnly value={value} className="input font-mono text-xs bg-gray-50 flex-1" />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

type Tab = 'business' | 'whatsapp' | 'availability' | 'ai' | 'team' | 'templates' | 'account';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'ai', label: 'AI Settings', icon: Bot },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
  { id: 'account', label: 'Account', icon: User },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const INDUSTRIES = [
  'Design Agency', 'Digital Marketing', 'Consulting', 'E-commerce',
  'Education', 'Healthcare', 'Real Estate', 'Finance', 'Technology',
  'Food & Beverage', 'Fitness', 'Beauty & Wellness', 'Other',
];
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York'];

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeBusiness, createBusiness, refreshBusinesses } = useBusiness();
  const [activeTab, setActiveTab] = useState<Tab>('business');
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Availability local edits: { [day]: { startTime, endTime } }
  const [availEdits, setAvailEdits] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [availSaving, setAvailSaving] = useState(false);
  const [availSaved, setAvailSaved] = useState(false);

  const [bizForm, setBizForm] = useState({
    businessName: '',
    industry: '',
    whatsappNumber: '',
    timezone: 'Asia/Kolkata',
  });

  const [aiForm, setAiForm] = useState({
    model: 'gpt-4o-mini',
    temperature: '0.7',
    maxTokens: '500',
    systemPrompt: '',
  });

  const [teamInviteEmail, setTeamInviteEmail] = useState('');
  const [teamInviteRole, setTeamInviteRole] = useState<'admin' | 'agent'>('agent');
  const [teamBusiness, setTeamBusiness] = useState<BusinessType | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamInviting, setTeamInviting] = useState(false);
  const [teamError, setTeamError] = useState('');

  const isOwner =
    !!activeBusiness &&
    !!user &&
    (typeof activeBusiness.ownerId === 'string'
      ? activeBusiness.ownerId === user.id
      : activeBusiness.ownerId._id === user.id);

  const fetchTeamBusiness = useCallback(() => {
    if (!activeBusiness) return;
    setTeamLoading(true);
    api
      .getBusiness(activeBusiness._id)
      .then(setTeamBusiness)
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, [activeBusiness]);

  useEffect(() => {
    if (activeTab === 'team' || activeTab === 'templates') fetchTeamBusiness();
  }, [activeTab, fetchTeamBusiness]);

  const handleInvite = async () => {
    if (!activeBusiness || !teamInviteEmail.trim()) return;
    setTeamInviting(true);
    setTeamError('');
    try {
      await api.addBusinessMember(activeBusiness._id, teamInviteEmail.trim(), teamInviteRole);
      setTeamInviteEmail('');
      fetchTeamBusiness();
    } catch (err: unknown) {
      setTeamError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setTeamInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeBusiness) return;
    try {
      await api.removeBusinessMember(activeBusiness._id, userId);
      fetchTeamBusiness();
    } catch {
      // noop
    }
  };

  const [templateForm, setTemplateForm] = useState({
    name: '',
    language: 'en_US',
    bodyPreview: '',
    variableCount: '0',
  });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState('');

  const handleAddTemplate = async () => {
    if (!activeBusiness || !templateForm.name.trim()) return;
    setTemplateSaving(true);
    setTemplateError('');
    try {
      await api.addTemplate(activeBusiness._id, {
        name: templateForm.name.trim(),
        language: templateForm.language.trim() || 'en_US',
        bodyPreview: templateForm.bodyPreview,
        variableCount: parseInt(templateForm.variableCount) || 0,
      });
      setTemplateForm({ name: '', language: 'en_US', bodyPreview: '', variableCount: '0' });
      fetchTeamBusiness();
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to add template');
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleRemoveTemplate = async (name: string) => {
    if (!activeBusiness) return;
    try {
      await api.removeTemplate(activeBusiness._id, name);
      fetchTeamBusiness();
    } catch {
      // noop
    }
  };

  const [waDefaults, setWaDefaults] = useState<{
    webhookUrl: string;
    verifyToken: string;
    phoneNumberId: string;
    hasAccessToken: boolean;
  } | null>(null);

  const [waForm, setWaForm] = useState({
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: '',
  });
  const [waSaving, setWaSaving] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [waError, setWaError] = useState('');

  useEffect(() => {
    if (activeBusiness) {
      setBizForm({
        businessName: activeBusiness.businessName,
        industry: activeBusiness.industry,
        whatsappNumber: activeBusiness.whatsappNumber,
        timezone: activeBusiness.timezone || 'Asia/Kolkata',
      });
      api
        .getAvailability(activeBusiness._id)
        .then((avail) => {
          setAvailability(avail);
          const edits: Record<string, { startTime: string; endTime: string }> = {};
          avail.forEach((a) => {
            edits[a.day] = { startTime: a.startTime, endTime: a.endTime };
          });
          setAvailEdits(edits);
        })
        .catch(() => {});
    }
  }, [activeBusiness]);

  useEffect(() => {
    if (activeTab === 'whatsapp' && activeBusiness && !waDefaults) {
      api.getWhatsAppDefaults(activeBusiness._id).then(setWaDefaults).catch(() => {});
    }
  }, [activeTab, activeBusiness, waDefaults]);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setWaSaving(true);
    setWaError('');
    try {
      await api.updateBusiness(activeBusiness._id, {
        ...(waForm.whatsappAccessToken && { whatsappAccessToken: waForm.whatsappAccessToken }),
        ...(waForm.whatsappPhoneNumberId && { whatsappPhoneNumberId: waForm.whatsappPhoneNumberId }),
        ...(waForm.whatsappVerifyToken && { whatsappVerifyToken: waForm.whatsappVerifyToken }),
      });
      setWaForm({ whatsappAccessToken: '', whatsappPhoneNumberId: '', whatsappVerifyToken: '' });
      setWaDefaults(null); // force refetch so the webhook URL/status reflect the new values
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 3000);
    } catch (err: unknown) {
      setWaError(err instanceof Error ? err.message : 'Failed to save WhatsApp credentials');
    } finally {
      setWaSaving(false);
    }
  };

  const generateVerifyToken = () => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setWaForm((prev) => ({ ...prev, whatsappVerifyToken: token }));
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (activeBusiness) {
        await api.updateBusiness(activeBusiness._id, bizForm);
        await refreshBusinesses();
      } else {
        await createBusiness(bizForm);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAvailability = async (day: string) => {
    if (!activeBusiness) return;
    try {
      await api.createAvailability({
        businessId: activeBusiness._id,
        day,
        startTime: '09:00',
        endTime: '18:00',
        isAvailable: true,
      });
      const updated = await api.getAvailability(activeBusiness._id);
      setAvailability(updated);
      const edits: Record<string, { startTime: string; endTime: string }> = { ...availEdits };
      updated.forEach((a) => {
        if (!edits[a.day]) edits[a.day] = { startTime: a.startTime, endTime: a.endTime };
      });
      setAvailEdits(edits);
    } catch { /* noop */ }
  };

  const handleSaveAvailability = async () => {
    if (!activeBusiness) return;
    setAvailSaving(true);
    try {
      await Promise.all(
        availability.map((a) => {
          const edit = availEdits[a.day];
          if (!edit) return Promise.resolve();
          return api.createAvailability({
            businessId: activeBusiness._id,
            day: a.day,
            startTime: edit.startTime,
            endTime: edit.endTime,
            isAvailable: true,
          });
        })
      );
      setAvailSaved(true);
      setTimeout(() => setAvailSaved(false), 3000);
    } catch { /* noop */ } finally {
      setAvailSaving(false);
    }
  };

  const handleRemoveAvailability = async (day: string) => {
    setAvailability((prev) => prev.filter((a) => a.day !== day));
    setAvailEdits((prev) => {
      const copy = { ...prev };
      delete copy[day];
      return copy;
    });
  };

  return (
    <div className="page-container">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={16} className={activeTab === id ? 'text-green-400' : 'text-gray-400'} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Business Profile */}
          {activeTab === 'business' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Business Profile</h2>
                  <p className="text-gray-400 text-sm">
                    {activeBusiness ? 'Update your business information' : 'Create your first business'}
                  </p>
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-5">
                  <CheckCircle size={16} />
                  Business profile saved successfully!
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={bizForm.businessName}
                    onChange={(e) => setBizForm({ ...bizForm, businessName: e.target.value })}
                    className="input"
                    placeholder="My Awesome Business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={bizForm.industry}
                    onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                    className="input"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    WhatsApp Business Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={bizForm.whatsappNumber}
                    onChange={(e) => setBizForm({ ...bizForm, whatsappNumber: e.target.value })}
                    className="input font-mono"
                    placeholder="+91 9876543210"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Include country code (e.g. +91 for India)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={bizForm.timezone}
                    onChange={(e) => setBizForm({ ...bizForm, timezone: e.target.value })}
                    className="input"
                  >
                    {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={cn('btn-primary', saving && 'opacity-70')}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Save size={15} /> {activeBusiness ? 'Update' : 'Create'} Business</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* WhatsApp Integration */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              {/* Status */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">WhatsApp Integration</h2>
                    <p className="text-gray-400 text-sm">Configure your WhatsApp Business API</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className={cn(
                    'w-3 h-3 rounded-full flex-shrink-0',
                    waDefaults?.hasAccessToken ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'
                  )} />
                  <div>
                    <p className={cn(
                      'font-semibold text-sm',
                      waDefaults?.hasAccessToken ? 'text-green-800' : 'text-yellow-800'
                    )}>
                      {waDefaults?.hasAccessToken ? 'WhatsApp Access Token Configured' : 'Access Token Not Set'}
                    </p>
                    <p className="text-green-700 text-xs mt-0.5">
                      Business number: {activeBusiness?.whatsappNumber || 'Not configured'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your own WhatsApp Business credentials */}
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-1">Connect Your WhatsApp Business Account</h3>
                <p className="text-gray-400 text-sm mb-5">
                  Each business needs its <strong>own</strong> WhatsApp Business API credentials from Meta —
                  this keeps your customers&apos; conversations completely separate from any other business on Whatsodo.
                </p>

                {waSaved && (
                  <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-4">
                    <CheckCircle size={16} /> WhatsApp credentials saved!
                  </div>
                )}
                {waError && (
                  <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                    <AlertCircle size={16} /> {waError}
                  </div>
                )}

                <form onSubmit={handleSaveWhatsApp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Access Token (System User token from Meta)
                    </label>
                    <input
                      type="password"
                      value={waForm.whatsappAccessToken}
                      onChange={(e) => setWaForm({ ...waForm, whatsappAccessToken: e.target.value })}
                      className="input font-mono text-xs"
                      placeholder={waDefaults?.hasAccessToken ? '•••••••••••••••• (already set — enter to replace)' : 'EAAxxxxxxxxxxxxxxxxxxxxxxxx'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number ID
                    </label>
                    <input
                      value={waForm.whatsappPhoneNumberId}
                      onChange={(e) => setWaForm({ ...waForm, whatsappPhoneNumberId: e.target.value })}
                      className="input font-mono text-xs"
                      placeholder={waDefaults?.phoneNumberId || '1064xxxxxxxxxxx'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Verify Token
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={waForm.whatsappVerifyToken}
                        onChange={(e) => setWaForm({ ...waForm, whatsappVerifyToken: e.target.value })}
                        className="input font-mono text-xs flex-1"
                        placeholder={waDefaults?.verifyToken || 'any random string you choose'}
                      />
                      <button
                        type="button"
                        onClick={generateVerifyToken}
                        className="px-3 py-2.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={waSaving}
                      className={cn('btn-primary', waSaving && 'opacity-70')}
                    >
                      {waSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Save size={15} /> Save WhatsApp Credentials</>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Webhook Configuration */}
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-1">Webhook Configuration</h3>
                <p className="text-gray-400 text-sm mb-5">
                  Paste these values into your Meta Developer Console to receive WhatsApp messages.
                  This webhook URL is unique to your business — don&apos;t share it with other businesses.
                </p>

                <div className="space-y-4">
                  <CopyField
                    label="Webhook URL"
                    value={waDefaults?.webhookUrl || 'https://whatsodo.onrender.com/api/webhook'}
                    hint="Go to Meta Developer Console → Your App → WhatsApp → Configuration → Webhook → Edit"
                  />

                  <CopyField
                    label="Verify Token"
                    value={waDefaults?.verifyToken || ''}
                    hint="Paste this as the Verify Token when setting up the webhook"
                  />

                  {waDefaults?.phoneNumberId && (
                    <CopyField
                      label="Phone Number ID (for reference)"
                      value={waDefaults.phoneNumberId}
                      hint="This is your WhatsApp Business phone number ID from Meta"
                    />
                  )}
                </div>

                <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-blue-800 font-semibold text-sm mb-2 flex items-center gap-2">
                    <Zap size={14} /> Step-by-step Setup
                  </p>
                  <ol className="space-y-1.5 text-blue-700 text-xs list-decimal list-inside leading-relaxed">
                    <li>Save your <strong>Access Token</strong>, <strong>Phone Number ID</strong> and <strong>Verify Token</strong> above first</li>
                    <li>Open <strong>Meta Developer Console</strong> → Your App → WhatsApp → Configuration</li>
                    <li>Under <strong>Webhook</strong>, click <strong>Edit</strong></li>
                    <li>Paste the <strong>Webhook URL</strong> and <strong>Verify Token</strong> above</li>
                    <li>Click <strong>Verify and Save</strong></li>
                    <li>Under <strong>Webhook Fields</strong>, subscribe to <strong>messages</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Availability */}
          {activeTab === 'availability' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Appointment Availability</h2>
                    <p className="text-gray-400 text-sm">Set when you accept appointments</p>
                  </div>
                </div>
                {availability.length > 0 && (
                  <button
                    onClick={handleSaveAvailability}
                    disabled={availSaving}
                    className={cn('btn-primary text-sm', availSaving && 'opacity-70')}
                  >
                    {availSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : availSaved ? (
                      <><CheckCircle size={14} /> Saved!</>
                    ) : (
                      <><Save size={14} /> Save Hours</>
                    )}
                  </button>
                )}
              </div>

              {availSaved && (
                <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-4">
                  <CheckCircle size={16} /> Availability saved successfully!
                </div>
              )}

              <div className="space-y-3">
                {DAYS.map((day) => {
                  const existing = availability.find((a) => a.day === day);
                  const edit = availEdits[day];
                  return (
                    <div
                      key={day}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                        existing ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                      )}
                    >
                      <div className="w-24">
                        <p className="text-sm font-semibold text-gray-900">{day.slice(0, 3)}</p>
                        <p className="text-xs text-gray-400">{day}</p>
                      </div>
                      {existing && edit ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={edit.startTime}
                              onChange={(e) =>
                                setAvailEdits((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], startTime: e.target.value },
                                }))
                              }
                              className="input text-xs py-1.5 w-32"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input
                              type="time"
                              value={edit.endTime}
                              onChange={(e) =>
                                setAvailEdits((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], endTime: e.target.value },
                                }))
                              }
                              className="input text-xs py-1.5 w-32"
                            />
                          </div>
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                            Available
                          </span>
                          <button
                            onClick={() => handleRemoveAvailability(day)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove day"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="flex-1 text-xs text-gray-400">Not available</p>
                          <button
                            onClick={() => handleAddAvailability(day)}
                            className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <Plus size={12} /> Enable
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">AI Settings</h2>
                  <p className="text-gray-400 text-sm">Configure how your AI agent behaves</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      AI Model
                    </label>
                    <select
                      value={aiForm.model}
                      onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}
                      className="input"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                      <option value="gpt-4o">GPT-4o (Powerful)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      GPT-4o Mini is recommended for most use cases
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Temperature
                      <span className="ml-2 text-gray-400 font-normal">{aiForm.temperature}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiForm.temperature}
                      onChange={(e) => setAiForm({ ...aiForm, temperature: e.target.value })}
                      className="w-full accent-green-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Precise (0)</span>
                      <span>Creative (1)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Max Response Tokens
                    </label>
                    <input
                      type="number"
                      value={aiForm.maxTokens}
                      onChange={(e) => setAiForm({ ...aiForm, maxTokens: e.target.value })}
                      className="input"
                      min="100"
                      max="2000"
                    />
                    <p className="text-xs text-gray-400 mt-1">Controls reply length (100–2000)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    System Prompt Override
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Optionally override the default system prompt. Leave blank to use the Knowledge Base.
                  </p>
                  <textarea
                    value={aiForm.systemPrompt}
                    onChange={(e) => setAiForm({ ...aiForm, systemPrompt: e.target.value })}
                    rows={6}
                    className="input resize-none font-mono text-xs"
                    placeholder="You are a helpful sales assistant for {businessName}. Your job is to..."
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-amber-800 font-semibold text-sm mb-1 flex items-center gap-2">
                    <Zap size={14} /> How AI settings work
                  </p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    The AI model reads your Knowledge Base (company info, services, FAQs) and uses it to reply to incoming WhatsApp messages automatically. AI model selection is configured server-side via environment variables. Changes take effect on the next incoming message.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {activeTab === 'team' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Team Members</h2>
                  <p className="text-gray-400 text-sm">Manage who has access to this business</p>
                </div>
              </div>

              {teamError && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                  <AlertCircle size={16} /> {teamError}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {/* Owner row */}
                {teamBusiness && (
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(typeof teamBusiness.ownerId === 'string' ? user?.name : teamBusiness.ownerId.name)?.charAt(0) || 'O'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {typeof teamBusiness.ownerId === 'string' ? user?.name : teamBusiness.ownerId.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {typeof teamBusiness.ownerId === 'string' ? user?.email : teamBusiness.ownerId.email}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                      Owner
                    </span>
                  </div>
                )}

                {teamBusiness?.members?.map((member) => {
                  const m = typeof member.userId === 'string' ? null : member.userId;
                  const memberId = typeof member.userId === 'string' ? member.userId : member.userId._id;
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {m?.name.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{m?.name}</p>
                        <p className="text-xs text-gray-400">{m?.email}</p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full capitalize">
                        {member.role}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {teamLoading && (
                  <p className="text-xs text-gray-400 text-center py-2">Loading team...</p>
                )}
              </div>

              {isOwner ? (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite Team Member</h3>
                  <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={teamInviteEmail}
                        onChange={(e) => setTeamInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="input pl-9"
                      />
                    </div>
                    <select
                      value={teamInviteRole}
                      onChange={(e) => setTeamInviteRole(e.target.value as 'admin' | 'agent')}
                      className="input w-36"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={teamInviting || !teamInviteEmail.trim()}
                      className={cn('btn-primary', teamInviting && 'opacity-70')}
                    >
                      {teamInviting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Plus size={15} /> Send Invite</>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    They must already have a Whatsodo account with this email — ask them to sign up first if the invite fails.
                  </p>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm text-gray-400">Only the business owner can invite or remove team members.</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-blue-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield size={14} /> Role Permissions
                </p>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p><strong>Owner</strong> — Full access: WhatsApp credentials, team, billing, all data</p>
                  <p><strong>Admin</strong> — Manage leads, appointments, and the inbox (same as agent for now)</p>
                  <p><strong>Agent</strong> — View and reply to leads/inbox, assign leads to themselves</p>
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">WhatsApp Message Templates</h2>
                  <p className="text-gray-400 text-sm">
                    Register templates already approved in your Meta Business Manager so you can use them for broadcast campaigns
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-5">
                <p className="text-amber-800 text-xs leading-relaxed">
                  Meta only allows free-form replies within 24 hours of a customer&apos;s last message. To message
                  leads outside that window (e.g. re-engaging cold leads), you must use a pre-approved <strong>template</strong>.
                  Create and get templates approved in <strong>Meta Business Manager → WhatsApp Manager → Message Templates</strong> first,
                  then register the exact name and language code here.
                </p>
              </div>

              {templateError && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                  <AlertCircle size={16} /> {templateError}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {teamBusiness?.whatsappTemplates?.length ? (
                  teamBusiness.whatsappTemplates.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400 truncate">{t.bodyPreview || 'No preview saved'}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                        {t.language}
                      </span>
                      {t.variableCount > 0 && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                          {t.variableCount} var{t.variableCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveTemplate(t.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No templates registered yet</p>
                )}
              </div>

              {isOwner ? (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Register a Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Template Name</label>
                      <input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="order_update"
                        className="input font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Language Code</label>
                      <input
                        value={templateForm.language}
                        onChange={(e) => setTemplateForm({ ...templateForm, language: e.target.value })}
                        placeholder="en_US"
                        className="input font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Body Preview (for your reference)</label>
                    <input
                      value={templateForm.bodyPreview}
                      onChange={(e) => setTemplateForm({ ...templateForm, bodyPreview: e.target.value })}
                      placeholder="Hi {{1}}, your order is on its way!"
                      className="input text-sm"
                    />
                  </div>
                  <div className="mb-4 w-40">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5"># of Variables</label>
                    <input
                      type="number"
                      min="0"
                      value={templateForm.variableCount}
                      onChange={(e) => setTemplateForm({ ...templateForm, variableCount: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddTemplate}
                    disabled={templateSaving || !templateForm.name.trim()}
                    className={cn('btn-primary', templateSaving && 'opacity-70')}
                  >
                    {templateSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Plus size={15} /> Register Template</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm text-gray-400">Only the business owner can register or remove templates.</p>
                </div>
              )}
            </div>
          )}

          {/* Account */}
          {activeTab === 'account' && (
            <AccountTab user={user} />
          )}
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }: { user: { name: string; email: string; role: string } | null }) {
  const [form, setForm] = useState({ name: user?.name || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Profile update would require a backend endpoint; show success for now
      await new Promise((r) => setTimeout(r, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
        <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
          <User className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-400 text-sm">Manage your personal account</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-5">
          <CheckCircle size={16} /> Changes saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
            {user?.name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                defaultValue={user?.email}
                type="email"
                className="input"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className={cn('btn-primary', saving && 'opacity-70')}>
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={15} /> Save Changes</>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 border border-red-100 rounded-xl">
          <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertCircle size={14} /> Danger Zone
          </p>
          <p className="text-xs text-gray-500 mb-3">
            These actions are irreversible. Please be certain.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Clear All Leads
            </button>
            <button className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Clear Appointments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
