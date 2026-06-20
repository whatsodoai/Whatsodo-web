'use client';

import { useState } from 'react';
import { Copy, Check, Mail, Lock } from 'lucide-react';

interface Props {
  email: string;
  password: string;
}

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-left">
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-sm font-mono text-gray-800 select-all">{value}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check size={13} />
              Copied
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DemoCredentials({ email, password }: Props) {
  return (
    <div className="bg-white border-2 border-dashed border-green-200 rounded-2xl p-6 space-y-4 text-left shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-sm font-semibold text-gray-700">Demo Login Credentials</p>
      </div>
      <CopyField label="Email" value={email} icon={Mail} />
      <CopyField label="Password" value={password} icon={Lock} />
      <p className="text-xs text-gray-400 pt-1">
        Click <strong>Copy</strong> next to each field, then paste on the login page.
      </p>
    </div>
  );
}
