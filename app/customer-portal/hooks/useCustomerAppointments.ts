/**
 * Customer Appointments Hook
 * 
 * Fetches customer's appointments and jobs from ServiceTitan API
 * MODULAR - Uses /api/customer-portal/appointments endpoint
 */

import { useQuery } from '@tanstack/react-query';

export interface ServiceTitanAppointment {
  id: number;
  jobId: number;
  appointmentNumber: string;
  start: string;
  end: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  status: string;
  specialInstructions: string;
  createdOn: string;
  modifiedOn: string;
  customerId: number;
  unused: boolean;
  createdById: number;
  isConfirmed: boolean;
}

export interface ServiceTitanJob {
  id: number;
  jobNumber: string;
  summary: string;
  customerId: number;
  locationId: number;
  jobStatus: string;
  completedOn: string;
  businessUnitId: number;
  jobTypeId: number;
  priority: string;
  campaignId: number;
  appointmentCount: number;
  firstAppointmentId: number;
  lastAppointmentId: number;
  createdOn: string;
  modifiedOn: string;
  total: number;
  invoiceId?: number;
  membershipId?: number;
  noCharge: boolean;
  appointments: ServiceTitanAppointment[];
}

export interface AppointmentsResponse {
  success: boolean;
  data: ServiceTitanJob[];
}

/**
 * Fetch customer appointments from ServiceTitan API
 * @param customerId - ServiceTitan customer ID (null prevents query from running)
 */
export function useCustomerAppointments(customerId: number | null) {
  return useQuery<AppointmentsResponse>({
    queryKey: ['/api/customer-portal/appointments', customerId],
    enabled: !!customerId, // Only fetch when customerId is available
    queryFn: async () => {
      const response = await fetch('/api/customer-portal/appointments', {
        credentials: 'include', // Send session cookie for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
