/**
 * Headless Referral Form Hook
 * 
 * Provides form logic, validation, and submission handling.
 * Can be used across multiple contexts: portal, public page, chatbot.
 * 
 * Features:
 * - Pre-fill referrer info (for authenticated users)
 * - Hide fields (for portal where referrer is known)
 * - Flexible validation (phone OR email required per party)
 * - Success/error callbacks for context-specific handling
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { referralFormSchema, type ReferralFormData } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export interface UseReferralFormConfig {
  /**
   * Pre-filled default values (e.g., authenticated user's info)
   */
  defaultValues?: Partial<ReferralFormData>;
  
  /**
   * Fields to hide from the UI (e.g., referrer info in portal)
   */
  hiddenFields?: {
    referrerName?: boolean;
    referrerEmail?: boolean;
    referrerPhone?: boolean;
    refereeName?: boolean;
    refereeEmail?: boolean;
    refereePhone?: boolean;
  };
  
  /**
   * Callback when submission succeeds
   */
  onSuccess?: (data: ReferralSubmissionResponse) => void;
  
  /**
   * Callback when submission fails
   */
  onError?: (error: Error) => void;
  
  /**
   * Whether to show toast notifications (default: true)
   */
  showToasts?: boolean;
}

export interface ReferralSubmissionResponse {
  success: boolean;
  message: string;
  referralId: number;
  voucherCode?: string;
}

export function useReferralForm(config: UseReferralFormConfig = {}) {
  const { 
    defaultValues = {},
    hiddenFields = {},
    onSuccess,
    onError,
    showToasts = true,
  } = config;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with react-hook-form + zod validation
  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      referrerName: defaultValues.referrerName || '',
      referrerEmail: defaultValues.referrerEmail || '',
      referrerPhone: defaultValues.referrerPhone || '',
      refereeName: defaultValues.refereeName || '',
      refereeEmail: defaultValues.refereeEmail || '',
      refereePhone: defaultValues.refereePhone || '',
    },
  });

  // Submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ReferralFormData): Promise<ReferralSubmissionResponse> => {
      const res = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit referral');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate referral queries
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      
      // Show success toast
      if (showToasts) {
        toast({
          title: 'Referral Submitted!',
          description: data.message,
        });
      }
      
      // Reset form
      form.reset();
      
      // Call custom success callback
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      // Show error toast
      if (showToasts) {
        toast({
          title: 'Submission Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      // Call custom error callback
      onError?.(error);
    },
  });

  // Form submission handler
  const handleSubmit = form.handleSubmit((data) => {
    submitMutation.mutate(data);
  });

  return {
    form,
    hiddenFields,
    isSubmitting: submitMutation.isPending,
    isSuccess: submitMutation.isSuccess,
    submissionData: submitMutation.data,
    handleSubmit,
  };
}
