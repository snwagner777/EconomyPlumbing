/**
 * ContactForm Component
 * 
 * Reusable form for adding/editing contact information (phone/email) for
 * customers or locations. Used in customer portal and admin interfaces.
 * 
 * Features:
 * - Type-specific validation (phone vs email)
 * - Optional memo/label field
 * - Shadcn form components with react-hook-form
 * - Context-aware (customer vs location)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  type ContactFormValues,
  contactFormSchema,
  CONTACT_TYPES,
  getContactTypeLabel,
  getContactPlaceholder,
  getContactInputType,
} from './types';

// ============================================================================
// Component Props
// ============================================================================

export interface ContactFormProps {
  /**
   * Initial values for editing existing contact
   */
  defaultValues?: Partial<ContactFormValues>;
  
  /**
   * Callback when form is submitted with valid data
   */
  onSubmit: (data: ContactFormValues) => void | Promise<void>;
  
  /**
   * Callback when user cancels
   */
  onCancel?: () => void;
  
  /**
   * Whether form is currently submitting
   */
  isSubmitting?: boolean;
  
  /**
   * Custom submit button text
   */
  submitText?: string;
  
  /**
   * Show optional name field (for location contacts)
   */
  showNameField?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ContactForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Add Contact',
  showNameField = false,
}: ContactFormProps) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      type: 'Phone',
      value: '',
      memo: '',
      name: '', // Fix controlled/uncontrolled warning for optional name field
      ...defaultValues,
    },
  });

  const selectedType = form.watch('type');

  const handleSubmit = async (data: ContactFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Contact Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Type *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-contact-type">
                    <SelectValue placeholder="Select contact type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONTACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getContactTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Value (phone or email) */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {selectedType === 'Email' ? 'Email Address' : 'Phone Number'} *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type={getContactInputType(selectedType)}
                  placeholder={getContactPlaceholder(selectedType)}
                  disabled={isSubmitting}
                  data-testid="input-contact-value"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional Name Field (for location contacts) */}
        {showNameField && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., John Smith"
                    disabled={isSubmitting}
                    data-testid="input-contact-name"
                  />
                </FormControl>
                <FormDescription>
                  Who should we contact at this location?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Memo/Label */}
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Work, Home, Personal"
                  disabled={isSubmitting}
                  data-testid="input-contact-memo"
                />
              </FormControl>
              <FormDescription>
                Add a label to help identify this contact method
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="button-cancel-contact"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit-contact"
          >
            {isSubmitting ? 'Saving...' : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
