/**
 * Public Referral Form
 * 
 * Full referral form for public-facing pages.
 * All fields are visible and required.
 */

'use client';

import { useReferralForm } from '@/hooks/useReferralForm';
import { ReferralFormView } from './ReferralFormView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface PublicReferralFormProps {
  /**
   * Optional callback when submission succeeds
   */
  onSuccess?: () => void;
  
  /**
   * Whether to wrap in a card (default: true)
   */
  showCard?: boolean;
  
  /**
   * Custom card title
   */
  cardTitle?: string;
  
  /**
   * Custom card description
   */
  cardDescription?: string;
}

export function PublicReferralForm({
  onSuccess,
  showCard = true,
  cardTitle = 'Refer a Friend',
  cardDescription = 'Earn rewards by referring friends and family! Both you and your friend get $25 off.',
}: PublicReferralFormProps) {
  const {
    form,
    hiddenFields,
    isSubmitting,
    handleSubmit,
  } = useReferralForm({
    onSuccess,
  });

  const formView = (
    <ReferralFormView
      form={form}
      onSubmit={handleSubmit}
      hiddenFields={hiddenFields}
      isSubmitting={isSubmitting}
      submitButtonText="Submit Referral"
      showContactHelp={true}
    />
  );

  if (!showCard) {
    return formView;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {formView}
      </CardContent>
    </Card>
  );
}
