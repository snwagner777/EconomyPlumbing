/**
 * A2P (Application-to-Person) Compliance Component
 * 
 * Provides opt-in checkboxes for SMS and email marketing communications
 * as required by TCPA and CAN-SPAM regulations
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface A2PConsentCheckboxesProps {
  smsConsent: boolean;
  emailConsent: boolean;
  onSmsConsentChange: (checked: boolean) => void;
  onEmailConsentChange: (checked: boolean) => void;
  showLabels?: boolean;
  className?: string;
}

export function A2PConsentCheckboxes({
  smsConsent,
  emailConsent,
  onSmsConsentChange,
  onEmailConsentChange,
  showLabels = true,
  className = "",
}: A2PConsentCheckboxesProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {showLabels && (
        <p className="text-sm font-medium">Communication Preferences (Optional)</p>
      )}
      
      <div className="flex items-start space-x-2">
        <Checkbox
          id="sms-consent"
          checked={smsConsent}
          onCheckedChange={onSmsConsentChange}
          data-testid="checkbox-sms-consent"
        />
        <Label
          htmlFor="sms-consent"
          className="text-sm text-muted-foreground font-normal cursor-pointer leading-tight"
        >
          I agree to receive promotional messages sent via an autodialer, and this agreement isn't a condition of any purchase. I also agree to the{" "}
          <a href="/terms-of-service" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">Terms of Service</a>{" "}
          and{" "}
          <a href="/privacy-policy" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.{" "}
          4 Msgs/Month. Msg & Data Rates may apply. Text STOP to opt out anytime. Text Help for more information.
        </Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="email-consent"
          checked={emailConsent}
          onCheckedChange={onEmailConsentChange}
          data-testid="checkbox-email-consent"
        />
        <Label
          htmlFor="email-consent"
          className="text-sm text-muted-foreground font-normal cursor-pointer leading-tight"
        >
          I'd like to receive email updates about plumbing tips, special offers, and company news.
          You can unsubscribe at any time.
        </Label>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        We respect your privacy. Your contact information will never be sold or shared with third parties.
      </p>
    </div>
  );
}
