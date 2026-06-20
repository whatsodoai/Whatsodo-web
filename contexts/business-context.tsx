'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Business } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from './auth-context';

interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  isLoading: boolean;
  setActiveBusiness: (b: Business) => void;
  refreshBusinesses: () => Promise<Business[]>;
  createBusiness: (data: {
    businessName: string;
    industry: string;
    whatsappNumber: string;
    timezone?: string;
  }) => Promise<Business>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setActiveBusiness = useCallback((b: Business) => {
    setActiveBusinessState(b);
    localStorage.setItem('whatsodo_business', JSON.stringify(b));
  }, []);

  const refreshBusinesses = useCallback(async (): Promise<Business[]> => {
    // Fall back to localStorage so callers immediately after login() still work
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('whatsodo_token') : null);
    if (!activeToken) return [];
    setIsLoading(true);
    try {
      const raw = await api.getBusinesses();
      // deduplicate by businessName, keeping the first occurrence
      const seen = new Set<string>();
      const list = raw.filter((b) => {
        if (seen.has(b.businessName)) return false;
        seen.add(b.businessName);
        return true;
      });
      setBusinesses(list);
      const stored = localStorage.getItem('whatsodo_business');
      if (stored) {
        const parsed: Business = JSON.parse(stored);
        const found = list.find((b) => b._id === parsed._id);
        setActiveBusinessState(found || list[0] || null);
      } else if (list.length === 1) {
        // Only auto-select when there's exactly one business
        setActiveBusinessState(list[0]);
        localStorage.setItem('whatsodo_business', JSON.stringify(list[0]));
      }
      return list;
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createBusiness = useCallback(
    async (data: {
      businessName: string;
      industry: string;
      whatsappNumber: string;
      timezone?: string;
    }) => {
      const res = await api.createBusiness(data);
      await refreshBusinesses();
      return res;
    },
    [refreshBusinesses]
  );

  useEffect(() => {
    if (token) refreshBusinesses();
  }, [token, refreshBusinesses]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        isLoading,
        setActiveBusiness,
        refreshBusinesses,
        createBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
