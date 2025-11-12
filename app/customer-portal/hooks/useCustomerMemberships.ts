/**
 * Customer Memberships Hook
 * 
 * Fetches customer's memberships from ServiceTitan API
 * MODULAR - Uses /api/customer-portal/memberships endpoint
 */

import { useQuery } from '@tanstack/react-query';

export interface MembershipBenefit {
  discounts: Array<{
    id: number;
    targetId: number;
    discount: number;
  }>;
  recurringServices: Array<{
    id: number;
    recurringServiceTypeId: number;
    allocation: number;
  }>;
}

export interface CustomerMembership {
  id: number;
  membershipTypeId: number;
  membershipTypeName: string;
  customerId: number;
  locationId: number | null;
  status: 'Active' | 'Suspended' | 'Expired' | 'Canceled' | 'Deleted';
  from: string;
  to: string | null;
  duration: number | null;
  billingFrequency: string;
  benefits?: MembershipBenefit;
}

export interface MembershipsResponse {
  success: boolean;
  memberships: {
    active: CustomerMembership[];
    expired: CustomerMembership[];
    other: CustomerMembership[];
  };
}

export function useCustomerMemberships() {
  return useQuery<MembershipsResponse>({
    queryKey: ['/api/customer-portal/memberships'],
    enabled: true, // Only fetch when authenticated (session validates in API)
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
