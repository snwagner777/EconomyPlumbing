/**
 * Referral Form Components - Barrel Export
 * 
 * Modular referral form system that works across multiple contexts:
 * - Customer Portal (pre-filled referrer info)
 * - Public Pages (full form)
 * - Chatbot (flexible configuration)
 * 
 * Architecture:
 * - useReferralForm: Headless hook with form logic
 * - ReferralFormView: Reusable UI component
 * - PortalReferralForm: Pre-filled wrapper for authenticated users
 * - PublicReferralForm: Full form wrapper for public pages
 */

export { useReferralForm } from '@/hooks/useReferralForm';
export type { UseReferralFormConfig, ReferralSubmissionResponse } from '@/hooks/useReferralForm';

export { ReferralFormView } from './ReferralFormView';
export type { ReferralFormViewProps } from './ReferralFormView';

export { PublicReferralForm } from './PublicReferralForm';
export type { PublicReferralFormProps } from './PublicReferralForm';

export { PortalReferralForm } from './PortalReferralForm';
export type { PortalReferralFormProps } from './PortalReferralForm';
