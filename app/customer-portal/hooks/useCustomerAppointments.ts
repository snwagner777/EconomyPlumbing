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

export function useCustomerAppointments() {
  return useQuery<AppointmentsResponse>({
    queryKey: ['/api/customer-portal/appointments'],
    enabled: true, // Only fetch when authenticated (session validates in API)
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
