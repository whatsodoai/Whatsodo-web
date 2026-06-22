'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useBusiness } from '@/contexts/business-context';
import { Building2, Users, Calendar, Zap, ArrowRight, LogOut } from 'lucide-react';
import { cn, avatarColor, getInitials } from '@/lib/utils';

export default function SelectBusinessPage() {
  const router = useRouter();
  const { token, isLoading: authLoading, logout } = useAuth();
  const { businesses, isLoading: bizLoading, setActiveBusiness } = useBusiness();

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [token, authLoading, router]);

  // If only one business exists, auto-redirect
  useEffect(() => {
    if (!bizLoading && businesses.length === 1) {
      setActiveBusiness(businesses[0]);
      router.replace('/dashboard');
    }
  }, [businesses, bizLoading, setActiveBusiness, router]);

  const handleSelect = (biz: (typeof businesses)[0]) => {
    setActiveBusiness(biz);
    router.push('/dashboard');
  };

  if (authLoading || bizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="bg-white/[0.03] backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-gray-100 font-bold text-lg">Whatsodo</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Choose a Business</h1>
            <p className="text-gray-400">
              You have access to {businesses.length} businesses. Select one to continue.
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-glass p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 font-medium mb-1">No businesses yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create your first business to get started
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-gray-100 rounded-xl text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Go to Settings <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <button
                  key={biz._id}
                  onClick={() => handleSelect(biz)}
                  className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-glass hover:shadow-glow hover:border-green-500/30 transition-all p-6 text-left"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0',
                        avatarColor(biz.businessName)
                      )}
                    >
                      {getInitials(biz.businessName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-100 text-base truncate">
                        {biz.businessName}
                      </p>
                      <p className="text-gray-400 text-sm mt-0.5">{biz.industry}</p>
                      <p className="text-gray-500 text-xs mt-0.5 font-mono">
                        {biz.whatsappNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> Leads
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Appointments
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select <ArrowRight size={12} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
