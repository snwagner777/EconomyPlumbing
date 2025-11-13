/**
 * Referral Form View Component
 * 
 * Reusable UI component that renders a referral form.
 * Accepts form controls from useReferralForm hook.
 * 
 * Features:
 * - Conditional field rendering based on hiddenFields config
 * - Responsive 2-column layout
 * - Proper form validation and error display
 * - Loading states during submission
 */

import { UseFormReturn } from 'react-hook-form';
import { ReferralFormData } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export interface ReferralFormViewProps {
  /**
   * Form instance from useReferralForm hook
   */
  form: UseFormReturn<ReferralFormData>;
  
  /**
   * Form submission handler
   */
  onSubmit: () => void;
  
  /**
   * Fields to hide from the UI
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
   * Whether form is currently submitting
   */
  isSubmitting?: boolean;
  
  /**
   * Custom submit button text
   */
  submitButtonText?: string;
  
  /**
   * Show helper text about contact requirements
   */
  showContactHelp?: boolean;
}

export function ReferralFormView({
  form,
  onSubmit,
  hiddenFields = {},
  isSubmitting = false,
  submitButtonText = 'Submit Referral',
  showContactHelp = true,
}: ReferralFormViewProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Referrer Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Your Information</h3>
            {showContactHelp && (
              <p className="text-sm text-muted-foreground">
                Provide at least one contact method (phone or email)
              </p>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {!hiddenFields.referrerName && (
              <FormField
                control={form.control}
                name="referrerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-referrer-name"
                        placeholder="John Doe"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!hiddenFields.referrerPhone && (
              <FormField
                control={form.control}
                name="referrerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Phone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel"
                        data-testid="input-referrer-phone"
                        placeholder="(512) 368-9159"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!hiddenFields.referrerEmail && (
              <FormField
                control={form.control}
                name="referrerEmail"
                render={({ field }) => (
                  <FormItem className={hiddenFields.referrerPhone ? 'md:col-span-2' : ''}>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        data-testid="input-referrer-email"
                        placeholder="john@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Referee Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Friend's Information</h3>
            {showContactHelp && (
              <p className="text-sm text-muted-foreground">
                Provide at least one contact method for your friend
              </p>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {!hiddenFields.refereeName && (
              <FormField
                control={form.control}
                name="refereeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-referee-name"
                        placeholder="Jane Smith"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!hiddenFields.refereePhone && (
              <FormField
                control={form.control}
                name="refereePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Phone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel"
                        data-testid="input-referee-phone"
                        placeholder="(512) 555-0123"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!hiddenFields.refereeEmail && (
              <FormField
                control={form.control}
                name="refereeEmail"
                render={({ field }) => (
                  <FormItem className={hiddenFields.refereePhone ? 'md:col-span-2' : ''}>
                    <FormLabel>Friend's Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        data-testid="input-referee-email"
                        placeholder="jane@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
          data-testid="button-submit-referral"
        >
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
