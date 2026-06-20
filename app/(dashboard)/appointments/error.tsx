'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Failed to load appointments</h2>
        <p className="text-gray-500 text-sm mb-5">{error.message}</p>
        <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    </div>
  );
}
