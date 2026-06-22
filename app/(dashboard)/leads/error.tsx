'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-gray-900 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Failed to load leads</h2>
        <p className="text-gray-500 text-sm mb-5">{error.message}</p>
        <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 border-2 border-gray-900 shadow-pop-sm transition-colors">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </div>
  );
}
