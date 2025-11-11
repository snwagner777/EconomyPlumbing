export interface ServiceTitanContact {
  id: number;
  type: string;
  value: string;
  memo?: string;
  phoneSettings?: {
    phoneNumber: string;
    doNotText: boolean;
  };
}

export interface ServiceTitanCustomer {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  contacts?: ServiceTitanContact[];
  customerTags?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface CustomerAccount {
  id: number;
  name: string;
  type?: string;
  address?: string;
  email?: string | null;
  maskedEmail?: string | null;
  phoneNumber?: string;
}

export type VerificationStep = 
  | 'lookup' 
  | 'verify-code' 
  | 'phone-lookup' 
  | 'phone-email-found' 
  | 'select-email' 
  | 'select-account' 
  | 'authenticated';

export interface AuthState {
  verificationStep: VerificationStep;
  lookupValue: string;
  lookupType: 'phone' | 'email';
  verificationCode: string;
  phoneLoginNumber: string;
  maskedEmail: string;
  actualEmail: string;
  lookupToken: string;
  pendingAccountId: string | null;
  availableAccounts: CustomerAccount[];
  availableEmails: Array<{ masked: string; value: string }>;
  selectedEmail: string;
  lookupError: string | null;
  lookupSuccess: string | null;
  isSearching: boolean;
  isLookingUp: boolean;
  isSendingLink: boolean;
  isVerifying: boolean;
}
