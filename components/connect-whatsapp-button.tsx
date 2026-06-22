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
}

export function ConnectWhatsAppButton({ businessId, onConnected }: ConnectWhatsAppButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const signupData = useRef<SignupData>({});

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
      }
    );
  };

  if (!META_APP_ID || !META_CONFIG_ID) return null;

  return (
    <>
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" />

      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-1">Connect with Meta</h3>
        <p className="text-gray-500 text-sm mb-4">
          Link your existing WhatsApp Business number in one click — no manual tokens needed.
        </p>

        {error && (
          <p className="text-red-700 text-sm mb-3 bg-red-50 border-2 border-gray-900 rounded-xl p-3">
            {error}
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
          {connecting ? 'Connecting…' : 'Continue with Meta'}
        </button>

        <div className="flex items-center gap-3 mt-5 mb-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or enter credentials manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      </div>
    </>
  );
}
