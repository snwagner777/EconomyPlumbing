/**
 * Portal State Context
 * 
 * Centralized state management for Customer Portal
 * Handles: active account/location, scheduler visibility, referral modal, etc.
 */

'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PortalAccount } from '../types';

interface PortalState {
  // Account/Location selection
  selectedAccountId: number | null;
  selectedLocationId: number | null;
  
  // Modal/Dialog visibility
  schedulerOpen: boolean;
  referralModalOpen: boolean;
  manageContactsOpen: boolean;
  reviewModalOpen: boolean;
  emailUsOpen: boolean;
  
  // Scheduler context
  schedulerContext?: {
    serviceType?: string;
    estimateId?: string;
    locationId?: number;
  };
}

interface PortalStateContextValue {
  state: PortalState;
  
  // Account/Location actions
  setSelectedAccountId: (id: number | null) => void;
  setSelectedLocationId: (id: number | null) => void;
  
  // Modal actions
  openScheduler: (context?: PortalState['schedulerContext']) => void;
  closeScheduler: () => void;
  openReferralModal: () => void;
  closeReferralModal: () => void;
  openManageContacts: () => void;
  closeManageContacts: () => void;
  openReviewModal: () => void;
  closeReviewModal: () => void;
  openEmailUs: () => void;
  closeEmailUs: () => void;
}

const PortalStateContext = createContext<PortalStateContextValue | null>(null);

export function PortalStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalState>({
    selectedAccountId: null,
    selectedLocationId: null,
    schedulerOpen: false,
    referralModalOpen: false,
    manageContactsOpen: false,
    reviewModalOpen: false,
    emailUsOpen: false,
  });

  const value: PortalStateContextValue = {
    state,
    
    setSelectedAccountId: (id) => setState(s => ({ ...s, selectedAccountId: id })),
    setSelectedLocationId: (id) => setState(s => ({ ...s, selectedLocationId: id })),
    
    openScheduler: (context) => setState(s => ({ 
      ...s, 
      schedulerOpen: true, 
      schedulerContext: context 
    })),
    closeScheduler: () => setState(s => ({ 
      ...s, 
      schedulerOpen: false, 
      schedulerContext: undefined 
    })),
    
    openReferralModal: () => setState(s => ({ ...s, referralModalOpen: true })),
    closeReferralModal: () => setState(s => ({ ...s, referralModalOpen: false })),
    
    openManageContacts: () => setState(s => ({ ...s, manageContactsOpen: true })),
    closeManageContacts: () => setState(s => ({ ...s, manageContactsOpen: false })),
    
    openReviewModal: () => setState(s => ({ ...s, reviewModalOpen: true })),
    closeReviewModal: () => setState(s => ({ ...s, reviewModalOpen: false })),
    
    openEmailUs: () => setState(s => ({ ...s, emailUsOpen: true })),
    closeEmailUs: () => setState(s => ({ ...s, emailUsOpen: false })),
  };

  return (
    <PortalStateContext.Provider value={value}>
      {children}
    </PortalStateContext.Provider>
  );
}

export function usePortalState() {
  const context = useContext(PortalStateContext);
  if (!context) {
    throw new Error('usePortalState must be used within PortalStateProvider');
  }
  return context;
}
