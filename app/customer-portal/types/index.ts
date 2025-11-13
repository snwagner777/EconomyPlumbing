/**
 * Shared TypeScript types for Customer Portal
 */

export interface PortalCustomerData {
  customer: {
    id: number;
    name: string;
    email?: string;
    phones?: Array<{
      type: string;
      value: string;
    }>;
  };
  locations: Array<{
    id: number;
    name: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    contacts?: any[];
  }>;
  memberships?: any[];
  estimates?: any[];
  invoices?: any[];
  jobs?: any[];
  appointments?: any[];
}

export interface PortalAccount {
  customerId: number;
  name: string;
  email?: string;
}
