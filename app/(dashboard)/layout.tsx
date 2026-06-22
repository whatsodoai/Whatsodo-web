'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { CommandPalette } from '@/components/command-palette';
import { FloatingBlob } from '@/components/motion/reveal';
import { useAuth } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-green-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <NotificationProvider>
      <CommandPalette />
      <div className="flex h-screen bg-[#fafaf7] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64 min-w-0 relative overflow-hidden">
          <FloatingBlob className="w-72 h-72 bg-green-300 -top-10 -right-10" />
          <FloatingBlob className="w-72 h-72 bg-pink-300 top-1/3 -left-20" delay />
          <FloatingBlob className="w-72 h-72 bg-cyan-300 bottom-0 right-1/4" />
          <Topbar />
          <main className="flex-1 overflow-y-auto relative z-10">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
