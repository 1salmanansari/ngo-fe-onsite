'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubdomainType } from '../types';

interface SubdomainContextType {
  subdomain: SubdomainType;
  setSubdomain: (sub: SubdomainType) => void;
  isSubdomainDetected: boolean;
  profileTab: 'Profile' | 'Rating';
  setProfileTab: (tab: 'Profile' | 'Rating') => void;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

export const ONSITE_URLS = [
  'https://register.pragatifoundation.com',
  'https://vitals.pragatifoundation.com',
  'https://profile.pragatifoundation.com',
  'https://referral.pragatifoundation.com',
  'https://tests.pragatifoundation.com',
  'https://meds.pragatifoundation.com',
];

export const SubdomainContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomainState] = useState<SubdomainType>('register');
  const [isSubdomainDetected, setIsSubdomainDetected] = useState(false);
  const [profileTab, setProfileTab] = useState<'Profile' | 'Rating'>('Profile');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check URL query params override (?subdomain=vitals or ?module=vitals)
    const params = new URLSearchParams(window.location.search);
    const querySub = (params.get('subdomain') || params.get('module')) as SubdomainType | null;

    if (
      querySub &&
      ['register', 'vitals', 'profile', 'referral', 'tests', 'meds'].includes(querySub)
    ) {
      setSubdomainState(querySub);
      localStorage.setItem('pragati_active_subdomain', querySub);
      setIsSubdomainDetected(true);
      return;
    }

    // 2. Check hostname subdomain: window.location.hostname.split('.')[0]
    const hostname = window.location.hostname.toLowerCase();
    const sub = hostname.split('.')[0] as SubdomainType;

    if (['register', 'vitals', 'profile', 'referral', 'tests', 'meds'].includes(sub)) {
      setSubdomainState(sub);
      setIsSubdomainDetected(true);
      return;
    }

    // 3. Fallback to localStorage or default to 'register'
    const saved = localStorage.getItem('pragati_active_subdomain') as SubdomainType;
    if (saved && ['register', 'vitals', 'profile', 'referral', 'tests', 'meds'].includes(saved)) {
      setSubdomainState(saved);
    } else {
      setSubdomainState('register');
    }
    setIsSubdomainDetected(true);
  }, []);

  const handleSetSubdomain = (newSub: SubdomainType) => {
    setSubdomainState(newSub);
    localStorage.setItem('pragati_active_subdomain', newSub);
    // Update URL query parameter without full reload for dev convenience
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('subdomain', newSub);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <SubdomainContext.Provider
      value={{
        subdomain,
        setSubdomain: handleSetSubdomain,
        isSubdomainDetected,
        profileTab,
        setProfileTab,
      }}
    >
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = (): SubdomainContextType => {
  const context = useContext(SubdomainContext);
  if (!context) {
    throw new Error('useSubdomain must be used within SubdomainContextProvider');
  }
  return context;
};
