'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Facebook, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID;

declare global {
  interface Window {
    FB?: {
      init: (opts: { appId?: string; version: string; xfbml: boolean }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        opts: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface SignupData {
  wabaId?: string;
  phoneNumberId?: string;
}

interface ConnectWhatsAppButtonProps {
  businessId: string;
  onConnected: () => void;
  /**
   * 'existing' uses Meta's coexistence flow — links a number that's
   * currently active in the WhatsApp Business App without disconnecting it.
   * 'new' uses the standard flow for registering a fresh number that has
   * never been on WhatsApp before.
   */
  mode?: 'existing' | 'new';
}

const MODE_COPY = {
  existing: {
    title: 'Connect Existing Number',
    description: 'Link the WhatsApp Business number you already use on your phone — it keeps working in the app, messages just sync here too.',
    cta: 'Continue with Meta',
  },
  new: {
    title: 'Create New Number',
    description: "Set up a fresh number on Meta's Cloud API. The number must not already be registered on WhatsApp (personal or business app).",
    cta: 'Set Up New Number',
  },
};

export function ConnectWhatsAppButton({ businessId, onConnected, mode = 'existing' }: ConnectWhatsAppButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkBlocked, setSdkBlocked] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const signupData = useRef<SignupData>({});

  useEffect(() => {
    // If fbAsyncInit never fires within 8s (ad-blocker / privacy extension
    // blocking connect.facebook.net, or the script loading but never
    // calling back, is the common cause), surface that instead of leaving
    // the button silently stuck on "Loading…" forever.
    const timeout = setTimeout(() => {
      setSdkReady((ready) => {
        if (!ready) setSdkBlocked(true);
        return ready;
      });
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId: META_APP_ID, version: 'v21.0', xfbml: false });
      setSdkReady(true);
    };

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(typeof event.data === 'string' ? event.data : '{}');
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
          signupData.current = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
          };
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleConnect = () => {
    if (!window.FB || !META_CONFIG_ID) return;
    setError('');
    setConnecting(true);
    signupData.current = {};

    window.FB.login(
      async (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setConnecting(false);
          setError('Facebook login was cancelled or failed.');
          return;
        }

        const { wabaId, phoneNumberId } = signupData.current;
        if (!wabaId || !phoneNumberId) {
          setConnecting(false);
          setError('Could not detect the connected WhatsApp Business Account. Please try again.');
          return;
        }

        try {
          await api.connectWhatsAppEmbedded(businessId, { code, wabaId, phoneNumberId });
          onConnected();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to connect WhatsApp account.');
        } finally {
          setConnecting(false);
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: '3',
          ...(mode === 'existing' && { featureType: 'whatsapp_business_app_onboarding' }),
        },
      }
    );
  };

  if (!META_APP_ID || !META_CONFIG_ID) return null;

  const copy = MODE_COPY[mode];

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onError={() => setSdkBlocked(true)}
      />

      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-1">{copy.title}</h3>
        <p className="text-gray-500 text-sm mb-4">{copy.description}</p>

        {error && (
          <p className="text-red-700 text-sm mb-3 bg-red-50 border-2 border-gray-900 rounded-xl p-3">
            {error}
          </p>
        )}

        {sdkBlocked && !sdkReady && (
          <p className="text-amber-700 text-sm mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            Meta&apos;s connect SDK didn&apos;t load. This is usually an ad-blocker or privacy
            extension blocking <code className="text-xs">connect.facebook.net</code> — try disabling
            it for this site, or use an incognito window, then reload.
          </p>
        )}

        <button
          type="button"
          onClick={handleConnect}
          disabled={!sdkReady || connecting}
          className={cn(
            'btn-primary',
            (!sdkReady || connecting) && 'opacity-70 pointer-events-none'
          )}
        >
          {connecting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Facebook size={15} />
          )}
          {connecting ? 'Connecting…' : !sdkReady ? 'Loading…' : copy.cta}
        </button>

        {mode === 'existing' && (
          <div className="flex items-center gap-3 mt-5 mb-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or enter credentials manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
      </div>
    </>
  );
}
