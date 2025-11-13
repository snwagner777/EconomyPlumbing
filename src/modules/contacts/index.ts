/**
 * Contacts Module
 * 
 * Reusable contact management for customer portal.
 * Provides forms, validation, and mutations for adding contacts to customers and locations.
 */

export { ContactForm } from './ContactForm';
export type { ContactFormProps } from './ContactForm';

export {
  type ContactType,
  type ContactFormData,
  type CustomerContactFormData,
  type LocationContactFormData,
  type ContactFormValues,
  type CustomerContactValues,
  type LocationContactValues,
  CONTACT_TYPES,
  contactFormSchema,
  customerContactSchema,
  locationContactSchema,
  getContactTypeLabel,
  getContactPlaceholder,
  getContactInputType,
} from './types';

export {
  useAddCustomerContact,
  useAddLocationContact,
  useUpdateContact,
  useDeleteContact,
} from './hooks/useContactMutation';
