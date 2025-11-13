/**
 * React Query hooks for invoices and estimates
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type {
  Invoice,
  InvoiceDetail,
  Estimate,
  EstimateDetail,
  InvoicesResponse,
  EstimatesResponse,
} from '../types';

/**
 * Fetch paginated invoices list
 */
export function useInvoices(params?: {
  locationId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryParams = new URLSearchParams();
  
  if (params?.locationId) queryParams.append('locationId', params.locationId.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  return useQuery<InvoicesResponse>({
    queryKey: ['/api/portal/invoices', params],
    queryFn: async () => {
      const response = await fetch(`/api/portal/invoices?${queryParams.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load invoices');
      }
      return response.json();
    },
  });
}

/**
 * Fetch single invoice with details
 */
export function useInvoiceDetail(invoiceId: number | null) {
  return useQuery<InvoiceDetail>({
    queryKey: ['/api/portal/invoices', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID required');
      
      const response = await fetch(`/api/portal/invoices/${invoiceId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load invoice details');
      }
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

/**
 * Request invoice PDF download
 */
export function useRequestInvoicePDF() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      invoiceId: number;
      customerName: string;
      customerEmail: string;
    }) => {
      const response = await fetch(`/api/portal/invoices/${params.invoiceId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: params.customerName,
          customerEmail: params.customerEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request invoice PDF');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'PDF Requested',
        description: 'You will receive the invoice PDF via email shortly.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request PDF',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Fetch paginated estimates list
 */
export function useEstimates(params?: {
  status?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const queryParams = new URLSearchParams();
  
  if (params?.status) queryParams.append('status', params.status);
  if (params?.includeInactive) queryParams.append('includeInactive', 'true');
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  return useQuery<EstimatesResponse>({
    queryKey: ['/api/portal/estimates', params],
    queryFn: async () => {
      const response = await fetch(`/api/portal/estimates?${queryParams.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load estimates');
      }
      return response.json();
    },
  });
}

/**
 * Fetch single estimate with details
 */
export function useEstimateDetail(estimateId: number | null) {
  return useQuery<EstimateDetail>({
    queryKey: ['/api/portal/estimates', estimateId],
    queryFn: async () => {
      if (!estimateId) throw new Error('Estimate ID required');
      
      const response = await fetch(`/api/portal/estimates/${estimateId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load estimate details');
      }
      return response.json();
    },
    enabled: !!estimateId,
  });
}

/**
 * Request estimate PDF download
 */
export function useRequestEstimatePDF() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      estimateId: number;
      customerName: string;
      customerEmail: string;
    }) => {
      const response = await fetch(`/api/portal/estimates/${params.estimateId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: params.customerName,
          customerEmail: params.customerEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request estimate PDF');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'PDF Requested',
        description: 'You will receive the estimate PDF via email shortly.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request PDF',
        variant: 'destructive',
      });
    },
  });
}
