'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Facebook, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

// ---------------------------------------------------------------------------
// Module-level shared FB SDK state
// Two component instances on the same page share one SDK load.
// ---------------------------------------------------------------------------
type ReadyCallback = () => void;
const readyCallbacks: ReadyCallback[] = [];
let sdkLoaded = false;   // FB SDK script finished loading
let sdkInitialized = false; // FB.init() called
let pendingAppId = '';   // stored as soon as we fetch it from the backend

/** Called by the Script onLoad (or fbAsyncInit fallback). */
function onSdkScriptLoaded() {
  sdkLoaded = true;
  if (pendingAppId && !sdkInitialized) {
    sdkInitialized = true;
    window.FB?.init({ appId: pendingAppId, version: 'v21.0', xfbml: false });
    readyCallbacks.splice(0).forEach((cb) => cb());
  }
}

/** Called when we receive the appId from the backend. */
function onAppIdAvailable(appId: string) {
  pendingAppId = appId;
  if (sdkLoaded && !sdkInitialized) {
    sdkInitialized = true;
    window.FB?.init({ appId, version: 'v21.0', xfbml: false });
    readyCallbacks.splice(0).forEach((cb) => cb());
  }
}

/** Register a per-instance callback that fires when FB is ready. */
function registerReadyCb(cb: ReadyCallback): () => void {
  if (sdkInitialized) {
    cb();
    return () => {};
  }
  readyCallbacks.push(cb);
  return () => {
    const idx = readyCallbacks.indexOf(cb);
    if (idx !== -1) readyCallbacks.splice(idx, 1);
  };
}

// fbAsyncInit is the FB SDK's own hook — set it early so it fires even if
// the script loads before our useEffect runs.
if (typeof window !== 'undefined') {
  window.fbAsyncInit = onSdkScriptLoaded;
}
// ---------------------------------------------------------------------------

interface SignupData {
  wabaId?: string;
  phoneNumberId?: string;
}

interface MetaConfig {
  appId: string;
  configId: string;
}

interface ConnectWhatsAppButtonProps {
  businessId: string;
  onConnected: () => void;
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
  const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const metaConfigRef = useRef<MetaConfig | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkBlocked, setSdkBlocked] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const signupData = useRef<SignupData>({});

  // Step 1 — fetch App ID + Config ID from the backend
  useEffect(() => {
    fetch(`${BASE_URL}/meta/app-config`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.appId && json?.data?.configId) {
          metaConfigRef.current = json.data;
          setMetaConfig(json.data);
          // Notify the shared SDK manager — handles the case where the SDK
          // script already loaded before this fetch completed.
          onAppIdAvailable(json.data.appId);
        } else {
          setConfigError(true);
        }
      })
      .catch(() => setConfigError(true))
      .finally(() => setConfigLoading(false));
  }, []);

  // Step 2 — register for the shared "FB ready" event + 10s blocked guard
  useEffect(() => {
    if (!metaConfig) return;

    const unregister = registerReadyCb(() => setSdkReady(true));

    const timeout = setTimeout(() => {
      setSdkReady((ready) => {
        if (!ready) setSdkBlocked(true);
        return ready;
      });
    }, 10000);

    return () => {
      unregister();
      clearTimeout(timeout);
    };
  }, [metaConfig]);

  // Step 3 — message listener for embedded signup data
  useEffect(() => {
    if (!metaConfig) return;

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(typeof event.data === 'string' ? event.data : '{}');
        const isFinish =
          data.type === 'WA_EMBEDDED_SIGNUP' &&
          (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING');
        if (isFinish) {
          signupData.current = {
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
          };
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [metaConfig]);

  const handleConnect = () => {
    if (!window.FB || !metaConfigRef.current?.configId) return;
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
        const isCoexistence = mode === 'existing';
        if (!wabaId || (!isCoexistence && !phoneNumberId)) {
          setConnecting(false);
          setError('Could not detect the connected WhatsApp Business Account. Please try again.');
          return;
        }

        try {
          await api.connectWhatsAppEmbedded(businessId, {
            code,
            wabaId,
            ...(phoneNumberId && { phoneNumberId }),
            isCoexistence,
          });
          onConnected();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to connect WhatsApp account.');
        } finally {
          setConnecting(false);
        }
      },
      {
        config_id: metaConfigRef.current.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: '3',
          ...(mode === 'existing' && { featureType: 'whatsapp_business_app_onboarding' }),
        },
      }
    );
  };

  const copy = MODE_COPY[mode];

  if (configLoading) {
    return (
      <div className="card p-6 flex items-center gap-3 text-gray-400 text-sm">
        <Loader2 size={15} className="animate-spin flex-shrink-0" />
        Loading…
      </div>
    );
  }

  if (configError || !metaConfig) {
    return (
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-1">{copy.title}</h3>
        <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            Meta Embedded Signup is not configured on the server. Add{' '}
            <code className="font-mono">META_APP_ID</code>,{' '}
            <code className="font-mono">META_APP_SECRET</code>, and{' '}
            <code className="font-mono">META_CONFIG_ID</code> to your backend environment variables, then redeploy.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Next.js deduplicates scripts with the same src — loads once for both instances */}
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={onSdkScriptLoaded}
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
