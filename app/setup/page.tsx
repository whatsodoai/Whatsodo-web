'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/contexts/business-context';
import { api } from '@/lib/api';
import { ConnectWhatsAppButton } from '@/components/connect-whatsapp-button';
import {
  Zap,
  Building2,
  Smartphone,
  Bot,
  Clock,
  CheckCircle,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'Design Agency', 'Digital Marketing', 'Consulting', 'E-commerce',
  'Education', 'Healthcare', 'Real Estate', 'Finance', 'Technology',
  'Food & Beverage', 'Fitness', 'Beauty & Wellness', 'Other',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STEPS = [
  { id: 1, label: 'Create Business', icon: Building2 },
  { id: 2, label: 'Connect WhatsApp', icon: Smartphone },
  { id: 3, label: 'Set Up AI', icon: Bot },
  { id: 4, label: 'Availability', icon: Clock },
  { id: 5, label: "You're Ready!", icon: CheckCircle },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg transition-colors flex-shrink-0"
    >
      {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { createBusiness, activeBusiness, refreshBusinesses } = useBusiness();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  // Step 1
  const [bizForm, setBizForm] = useState({
    businessName: '',
    industry: '',
    whatsappNumber: '',
  });

  // Step 2
  const [waDefaults, setWaDefaults] = useState<{
    webhookUrl: string;
    verifyToken: string;
    phoneNumberId: string;
    hasAccessToken: boolean;
  } | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waCredsForm, setWaCredsForm] = useState({
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: '',
  });
  const [waSaving, setWaSaving] = useState(false);
  const [waSaved, setWaSaved] = useState(false);

  // Step 3
  const [kbForm, setKbForm] = useState({
    companyName: '',
    companyDescription: '',
    services: '',
    tone: 'Professional',
  });

  // Step 4
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({
    Monday: true, Tuesday: true, Wednesday: true,
    Thursday: true, Friday: true, Saturday: false, Sunday: false,
  });
  const [dayHours, setDayHours] = useState<Record<string, { start: string; end: string }>>({
    Monday: { start: '09:00', end: '18:00' },
    Tuesday: { start: '09:00', end: '18:00' },
    Wednesday: { start: '09:00', end: '18:00' },
    Thursday: { start: '09:00', end: '18:00' },
    Friday: { start: '09:00', end: '18:00' },
    Saturday: { start: '09:00', end: '18:00' },
    Sunday: { start: '09:00', end: '18:00' },
  });

  // Prefill KB company name from business name
  useEffect(() => {
    if (bizForm.businessName && !kbForm.companyName) {
      setKbForm((prev) => ({ ...prev, companyName: bizForm.businessName }));
    }
  }, [bizForm.businessName, kbForm.companyName]);

  const fetchWaDefaults = useCallback(async () => {
    const businessId = createdBusinessId || activeBusiness?._id;
    if (!businessId) return;
    setWaLoading(true);
    try {
      const data = await api.getWhatsAppDefaults(businessId);
      setWaDefaults(data);
    } catch {
      // non-fatal
    } finally {
      setWaLoading(false);
    }
  }, [createdBusinessId, activeBusiness]);

  const handleSaveWhatsAppCreds = async () => {
    const businessId = createdBusinessId || activeBusiness?._id;
    if (!businessId) return;
    setWaSaving(true);
    setError('');
    try {
      await api.updateBusiness(businessId, {
        ...(waCredsForm.whatsappAccessToken && { whatsappAccessToken: waCredsForm.whatsappAccessToken }),
        ...(waCredsForm.whatsappPhoneNumberId && { whatsappPhoneNumberId: waCredsForm.whatsappPhoneNumberId }),
        ...(waCredsForm.whatsappVerifyToken && { whatsappVerifyToken: waCredsForm.whatsappVerifyToken }),
      });
      setWaCredsForm({ whatsappAccessToken: '', whatsappPhoneNumberId: '', whatsappVerifyToken: '' });
      await fetchWaDefaults();
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save WhatsApp credentials');
    } finally {
      setWaSaving(false);
    }
  };

  const generateVerifyToken = () => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setWaCredsForm((prev) => ({ ...prev, whatsappVerifyToken: token }));
  };

  useEffect(() => {
    if (step === 2) fetchWaDefaults();
  }, [step, fetchWaDefaults]);

  const handleStep1 = async () => {
    setIsLoading(true);
    setError('');
    try {
      const biz = await createBusiness({
        businessName: bizForm.businessName,
        industry: bizForm.industry,
        whatsappNumber: bizForm.whatsappNumber,
      });
      setCreatedBusinessId(biz._id);
      setKbForm((prev) => ({ ...prev, companyName: bizForm.businessName }));
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async (skip = false) => {
    const businessId = createdBusinessId || activeBusiness?._id;
    if (!businessId || skip) { setStep(4); return; }
    setIsLoading(true);
    try {
      await api.createKnowledgeBase({
        businessId,
        companyName: kbForm.companyName,
        companyDescription: kbForm.companyDescription,
        services: kbForm.services.split(',').map((s) => s.trim()).filter(Boolean),
        tone: kbForm.tone,
      });
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
      setStep(4);
    }
  };

  const handleStep4 = async (skip = false) => {
    const businessId = createdBusinessId || activeBusiness?._id;
    if (!businessId || skip) { setStep(5); return; }
    setIsLoading(true);
    try {
      const activeDays = DAYS.filter((d) => enabledDays[d]);
      await Promise.all(
        activeDays.map((day) =>
          api.createAvailability({
            businessId,
            day,
            startTime: dayHours[day].start,
            endTime: dayHours[day].end,
            isAvailable: true,
          })
        )
      );
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
      setStep(5);
    }
  };

  const handleFinish = async () => {
    await refreshBusinesses();
    router.push('/dashboard');
  };

  const completedSteps = [
    !!createdBusinessId,
    step > 2,
    step > 3,
    step > 4,
    step === 5,
  ];

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-gray-900 font-bold text-lg">Whatsodo Setup</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-8">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-colors border',
                  isActive ? 'bg-green-500 text-white border-green-500' :
                    isDone ? 'bg-green-100 text-green-700 border-green-500' :
                      'bg-gray-50 text-gray-400 border-gray-200'
                )}>
                  {isDone ? (
                    <CheckCircle size={13} />
                  ) : (
                    <s.icon size={13} />
                  )}
                  <span>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Create Business */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-soft-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Create Your Business</h2>
                <p className="text-gray-400 text-sm">Tell us a bit about your business</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={bizForm.businessName}
                  onChange={(e) => setBizForm({ ...bizForm, businessName: e.target.value })}
                  placeholder="e.g. Acme Consulting"
                  className="input w-full px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  value={bizForm.industry}
                  onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                  className="input w-full px-4 py-3"
                >
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp Business Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={bizForm.whatsappNumber}
                  onChange={(e) => setBizForm({ ...bizForm, whatsappNumber: e.target.value })}
                  placeholder="e.g. 917305333573"
                  className="input w-full px-4 py-3 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code without + (e.g. 91 for India)</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleStep1}
                  disabled={isLoading || !bizForm.businessName || !bizForm.industry || !bizForm.whatsappNumber}
                  className={cn(
                    'btn-primary flex items-center gap-2 px-6 py-3 text-sm',
                    (isLoading || !bizForm.businessName || !bizForm.industry || !bizForm.whatsappNumber) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Next <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Connect WhatsApp */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-soft-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Connect WhatsApp</h2>
                <p className="text-gray-400 text-sm">Configure your Meta webhook to receive messages</p>
              </div>
            </div>

            {waLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                {(createdBusinessId || activeBusiness?._id) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ConnectWhatsAppButton
                      mode="existing"
                      businessId={(createdBusinessId || activeBusiness!._id) as string}
                      onConnected={() => { setWaSaved(true); fetchWaDefaults(); }}
                    />
                    <ConnectWhatsAppButton
                      mode="new"
                      businessId={(createdBusinessId || activeBusiness!._id) as string}
                      onConnected={() => { setWaSaved(true); fetchWaDefaults(); }}
                    />
                  </div>
                )}

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-700 font-semibold text-sm mb-1">
                    Prefer to enter credentials manually?
                  </p>
                  <p className="text-amber-700/80 text-xs leading-relaxed">
                    In Meta Developer Console → your App → WhatsApp → API Setup, you can add a phone number you
                    already use for WhatsApp Business. Paste that number&apos;s Access Token and Phone Number ID
                    below so this business automates its <strong>own</strong> WhatsApp account — separate from
                    every other business on Whatsodo.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Access Token (System User token from Meta)
                  </label>
                  <input
                    type="password"
                    value={waCredsForm.whatsappAccessToken}
                    onChange={(e) => setWaCredsForm({ ...waCredsForm, whatsappAccessToken: e.target.value })}
                    className="input w-full px-4 py-3 font-mono"
                    placeholder={waDefaults?.hasAccessToken ? '•••••••••••••••• (already set — enter to replace)' : 'EAAxxxxxxxxxxxxxxxxxxxxxxxx'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number ID
                  </label>
                  <input
                    value={waCredsForm.whatsappPhoneNumberId}
                    onChange={(e) => setWaCredsForm({ ...waCredsForm, whatsappPhoneNumberId: e.target.value })}
                    className="input w-full px-4 py-3 font-mono"
                    placeholder={waDefaults?.phoneNumberId || '1064xxxxxxxxxxx'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Verify Token
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={waCredsForm.whatsappVerifyToken}
                      onChange={(e) => setWaCredsForm({ ...waCredsForm, whatsappVerifyToken: e.target.value })}
                      className="input flex-1 px-4 py-3 font-mono"
                      placeholder={waDefaults?.verifyToken || 'any random string you choose'}
                    />
                    <button
                      type="button"
                      onClick={generateVerifyToken}
                      className="btn-secondary px-3 py-3 text-xs flex-shrink-0"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveWhatsAppCreds}
                    disabled={waSaving}
                    className={cn(
                      'btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm',
                      waSaving && 'opacity-70'
                    )}
                  >
                    {waSaving ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      'Save WhatsApp Credentials'
                    )}
                  </button>
                  {waSaved && (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                      <CheckCircle size={15} /> Saved!
                    </span>
                  )}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-700 font-semibold text-sm mb-2">Then finish setup in Meta</p>
                  <ol className="space-y-1 text-blue-700/80 text-xs list-decimal list-inside leading-relaxed">
                    <li>Save your credentials above first</li>
                    <li>Go to <strong>Meta Developer Console</strong> → Your App → WhatsApp → Configuration</li>
                    <li>Under <strong>Webhook</strong>, click Edit and paste the values below</li>
                    <li>Click <strong>Verify and Save</strong></li>
                    <li>Subscribe to the <strong>messages</strong> field</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={waDefaults?.webhookUrl || 'https://whatsodo.onrender.com/api/webhook'}
                      className="input flex-1 px-4 py-3 font-mono text-gray-700 bg-gray-50"
                    />
                    <CopyButton text={waDefaults?.webhookUrl || 'https://whatsodo.onrender.com/api/webhook'} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verify Token
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={waDefaults?.verifyToken || ''}
                      className="input flex-1 px-4 py-3 font-mono text-gray-700 bg-gray-50"
                    />
                    <CopyButton text={waDefaults?.verifyToken || ''} />
                  </div>
                </div>

                {waDefaults?.phoneNumberId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number ID <span className="font-normal text-gray-400">(for reference)</span>
                    </label>
                    <input
                      readOnly
                      value={waDefaults.phoneNumberId}
                      className="input w-full px-4 py-3 font-mono text-gray-400 bg-gray-50"
                    />
                  </div>
                )}

                {waDefaults?.hasAccessToken && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    <p className="text-green-700 text-xs font-medium">WhatsApp access token is configured for this business</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
                    >
                      Next <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — AI / Knowledge Base */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-soft-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Set Up AI Knowledge Base</h2>
                <p className="text-gray-400 text-sm">Help your AI understand your business</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name
                </label>
                <input
                  value={kbForm.companyName}
                  onChange={(e) => setKbForm({ ...kbForm, companyName: e.target.value })}
                  placeholder="Your company name"
                  className="input w-full px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Description
                </label>
                <textarea
                  value={kbForm.companyDescription}
                  onChange={(e) => setKbForm({ ...kbForm, companyDescription: e.target.value })}
                  rows={3}
                  placeholder="What does your company do? Who do you serve?"
                  className="input w-full px-4 py-3 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Services / Products
                </label>
                <input
                  value={kbForm.services}
                  onChange={(e) => setKbForm({ ...kbForm, services: e.target.value })}
                  placeholder="e.g. Web Design, SEO, Social Media Marketing"
                  className="input w-full px-4 py-3"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple services with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tone of Voice
                </label>
                <select
                  value={kbForm.tone}
                  onChange={(e) => setKbForm({ ...kbForm, tone: e.target.value })}
                  className="input w-full px-4 py-3"
                >
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStep3(true)}
                    className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={() => handleStep3(false)}
                    disabled={isLoading}
                    className={cn(
                      'btn-primary flex items-center gap-2 px-6 py-3 text-sm',
                      isLoading && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Save & Next <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Availability */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-soft-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Set Your Availability</h2>
                <p className="text-gray-400 text-sm">When can customers book appointments?</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={cn(
                    'flex items-center gap-4 p-3.5 rounded-xl border-2 transition-colors',
                    enabledDays[day] ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setEnabledDays((prev) => ({ ...prev, [day]: !prev[day] }))}
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors flex-shrink-0 relative',
                      enabledDays[day] ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                      enabledDays[day] ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                  <p className="text-sm font-medium text-gray-900 w-24">{day}</p>
                  {enabledDays[day] && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={dayHours[day].start}
                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                        className="input px-3 py-1.5 text-xs"
                      />
                      <span className="text-gray-400 text-xs">—</span>
                      <input
                        type="time"
                        value={dayHours[day].end}
                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                        className="input px-3 py-1.5 text-xs"
                      />
                    </div>
                  )}
                  {!enabledDays[day] && (
                    <p className="text-xs text-gray-400 flex-1">Closed</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStep4(true)}
                  className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleStep4(false)}
                  disabled={isLoading}
                  className={cn(
                    'btn-primary flex items-center gap-2 px-6 py-3 text-sm',
                    isLoading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Save & Next <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — All Done */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4 animate-slide-up">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-2xl mb-2">You&apos;re all set!</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Your Whatsodo account is ready. Start capturing and converting WhatsApp leads with AI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Building2, label: 'Business Created', done: !!createdBusinessId, color: 'blue' },
                { icon: Bot, label: 'AI Knowledge Base', done: !!kbForm.companyDescription, color: 'purple' },
                { icon: Clock, label: 'Availability Set', done: DAYS.some((d) => enabledDays[d]), color: 'orange' },
              ].map(({ icon: Icon, label, done, color }) => (
                <div
                  key={label}
                  className={cn(
                    'p-4 rounded-xl border-2',
                    done ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2',
                    color === 'blue' ? 'bg-blue-50' : color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'
                  )}>
                    <Icon size={18} className={cn(
                      color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                    )} />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  {done && (
                    <p className="text-xs text-green-600 mt-0.5 font-medium">Configured</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleFinish}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 px-6 text-sm"
              >
                Go to Dashboard <ArrowRight size={16} />
              </button>
              <p className="text-xs text-gray-400">
                You can update all settings later from the Settings page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
