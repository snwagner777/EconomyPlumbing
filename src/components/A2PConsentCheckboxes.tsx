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
          I consent to receive text messages (SMS) from Economy Plumbing Services about appointments,
          promotions, and service updates. Message and data rates may apply. Reply STOP to opt out.
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
