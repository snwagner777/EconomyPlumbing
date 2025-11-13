/**
 * Portal Referral Form
 * 
 * Pre-filled referral form for authenticated customer portal users.
 * Referrer information is auto-filled from customer data.
 */

'use client';

import { useReferralForm } from '@/hooks/useReferralForm';
import { ReferralFormView } from './ReferralFormView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Gift } from 'lucide-react';

export interface PortalReferralFormProps {
  /**
   * Pre-filled referrer name
   */
  referrerName: string;
  
  /**
   * Pre-filled referrer phone (optional)
   */
  referrerPhone?: string;
  
  /**
   * Pre-filled referrer email (optional)
   */
  referrerEmail?: string;
  
  /**
   * Optional callback when submission succeeds
   */
  onSuccess?: () => void;
  
  /**
   * Whether to show the success message with referral details
   */
  showSuccessMessage?: boolean;
}

export function PortalReferralForm({
  referrerName,
  referrerPhone,
  referrerEmail,
  onSuccess,
  showSuccessMessage = true,
}: PortalReferralFormProps) {
  // Only hide referrer contact fields if they're actually provided
  // This ensures users without phone/email can still submit by filling them in
  const hasPhone = Boolean(referrerPhone && referrerPhone.trim());
  const hasEmail = Boolean(referrerEmail && referrerEmail.trim());
  
  // Defensive check: Ensure at least one contact field is visible or pre-filled
  // This guarantees the schema requirement ("at least one contact method") is always satisfiable
  const canHidePhone = hasPhone && hasEmail; // Can only hide phone if we also have email
  const canHideEmail = hasEmail && hasPhone; // Can only hide email if we also have phone
  
  const {
    form,
    hiddenFields,
    isSubmitting,
    isSuccess,
    submissionData,
    handleSubmit,
  } = useReferralForm({
    defaultValues: {
      referrerName,
      referrerPhone: referrerPhone || '',
      referrerEmail: referrerEmail || '',
    },
    // Only hide fields that have valid default values
    // At least one contact method must be visible or pre-filled for schema validation
    hiddenFields: {
      referrerName: true, // Always hide name (always provided)
      referrerPhone: canHidePhone, // Only hide if we have BOTH phone AND email
      referrerEmail: canHideEmail, // Only hide if we have BOTH phone AND email
    },
    onSuccess,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Refer a Friend & Earn $25
          </CardTitle>
          <CardDescription>
            You and your friend both get $25 off when they complete their first service!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSuccessMessage && isSuccess && submissionData && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {submissionData.message}
                {submissionData.voucherCode && (
                  <span className="block mt-2 font-semibold">
                    Voucher Code: {submissionData.voucherCode}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <ReferralFormView
            form={form}
            onSubmit={handleSubmit}
            hiddenFields={hiddenFields}
            isSubmitting={isSubmitting}
            submitButtonText="Send Referral"
            showContactHelp={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
