/**
 * Truly Conversational Customer Creation - One Question at a Time
 * 
 * Feels like a natural conversation, not a form
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, User, Phone, Mail, MapPin, Building, Ticket, DoorClosed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewCustomerWizardProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isGrouponService?: boolean;
}

type ConversationStep = 
  | 'problemDescription'
  | 'firstName' | 'lastName' | 'customerType' 
  | 'phone' | 'email' 
  | 'address' | 'unit' | 'city' | 'state' | 'zip'
  | 'sameAsBilling' | 'locationName' | 'locationAddress' | 'locationUnit' | 'locationCity' | 'locationState' | 'locationZip'
  | 'grouponVoucher' | 'specialInstructions';

export function NewCustomerWizard({ onSubmit, onCancel, isSubmitting, isGrouponService }: NewCustomerWizardProps) {
  const [step, setStep] = useState<ConversationStep>('problemDescription');
  const [data, setData] = useState<any>({
    customerType: 'Residential',
    sameAsBilling: true,
    city: 'Austin',
    state: 'TX',
    locationCity: 'Austin',
    locationState: 'TX',
  });
  const [error, setError] = useState('');

  const handleAnswer = (value: string | boolean, nextStep?: ConversationStep) => {
    setError('');
    const newData = { ...data, [step]: value };
    setData(newData);
    
    if (nextStep) {
      setStep(nextStep);
    } else {
      // Auto-advance logic
      advanceToNextStep(newData);
    }
  };

  const advanceToNextStep = (currentData: any) => {
    const stepOrder: ConversationStep[] = [
      'problemDescription',
      'firstName', 'lastName', 'customerType',
      'phone', 'email',
      'address', 'unit', 'city', 'state', 'zip',
      'sameAsBilling', 'locationName', 'locationAddress', 'locationUnit', 'locationCity', 'locationState', 'locationZip',
      'grouponVoucher', 'specialInstructions'
    ];

    const currentIndex = stepOrder.indexOf(step);
    let nextIndex = currentIndex + 1;

    // Skip unit if empty
    if (stepOrder[nextIndex] === 'unit' && step === 'address') {
      // Show unit but allow skip
    }

    // Skip location fields if sameAsBilling is true
    if (currentData.sameAsBilling && nextIndex >= stepOrder.indexOf('locationName') && nextIndex < stepOrder.indexOf('grouponVoucher')) {
      // Skip to Groupon voucher if this is a Groupon service, otherwise skip to special instructions
      if (isGrouponService) {
        setStep('grouponVoucher');
      } else {
        setStep('specialInstructions');
      }
      return;
    }

    // Skip Groupon voucher if not a Groupon service
    if (stepOrder[nextIndex] === 'grouponVoucher' && !isGrouponService) {
      setStep('specialInstructions');
      return;
    }

    // Skip location unit if we're collecting location details
    if (stepOrder[nextIndex] === 'locationUnit' && step === 'locationAddress') {
      // Show locationUnit but allow skip
    }

    if (nextIndex < stepOrder.length) {
      setStep(stepOrder[nextIndex]);
    } else {
      onSubmit(currentData);
    }
  };

  const goBack = () => {
    const stepOrder: ConversationStep[] = [
      'problemDescription',
      'firstName', 'lastName', 'customerType',
      'phone', 'email',
      'address', 'unit', 'city', 'state', 'zip',
      'sameAsBilling', 'locationName', 'locationAddress', 'locationUnit', 'locationCity', 'locationState', 'locationZip',
      'grouponVoucher', 'specialInstructions'
    ];

    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      let prevIndex = currentIndex - 1;
      
      // Skip Groupon voucher if going back and not a Groupon service
      if (stepOrder[prevIndex] === 'grouponVoucher' && !isGrouponService) {
        prevIndex--;
      }
      
      setStep(stepOrder[prevIndex]);
    }
  };

  const validateAndContinue = (value: string, pattern?: RegExp, errorMsg?: string) => {
    if (!value.trim()) {
      setError('This field is required');
      return;
    }
    if (pattern && !pattern.test(value)) {
      setError(errorMsg || 'Invalid format');
      return;
    }
    handleAnswer(value);
  };

  const renderQuestion = () => {
    switch (step) {
      case 'problemDescription':
        return (
          <QuestionBoxTextarea
            icon={<DoorClosed className="w-6 h-6" />}
            question="What plumbing issue can we help you with?"
            description="The more details you provide, the better we can prepare"
            value={data.problemDescription || ''}
            onChange={(v) => setData({ ...data, problemDescription: v })}
            onEnter={() => {
              // Textarea can be empty - allow skip
              handleAnswer(data.problemDescription || '');
            }}
            placeholder="e.g., Kitchen sink is leaking under the cabinet, water heater making strange noises, toilet won't stop running..."
            autoFocus
            rows={4}
          />
        );
      
      case 'firstName':
        return (
          <QuestionBox
            icon={<User className="w-6 h-6" />}
            question="What's your first name?"
            value={data.firstName || ''}
            onChange={(v) => setData({ ...data, firstName: v })}
            onEnter={() => validateAndContinue(data.firstName || '')}
            placeholder="e.g., John"
            autoFocus
          />
        );

      case 'lastName':
        return (
          <QuestionBox
            icon={<User className="w-6 h-6" />}
            question="And your last name?"
            value={data.lastName || ''}
            onChange={(v) => setData({ ...data, lastName: v })}
            onEnter={() => validateAndContinue(data.lastName || '')}
            placeholder="e.g., Smith"
            autoFocus
          />
        );

      case 'customerType':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-medium">Is this for residential or commercial property?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This helps us prepare the right equipment and pricing
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 text-base"
                onClick={() => handleAnswer('Residential')}
                data-testid="button-residential"
              >
                🏠 Residential
              </Button>
              <Button
                variant="outline"
                className="h-20 text-base"
                onClick={() => handleAnswer('Commercial')}
                data-testid="button-commercial"
              >
                🏢 Commercial
              </Button>
            </div>
          </div>
        );

      case 'phone':
        return (
          <QuestionBox
            icon={<Phone className="w-6 h-6" />}
            question="What's the best phone number to reach you?"
            value={data.phone || ''}
            onChange={(v) => setData({ ...data, phone: v })}
            onEnter={() => validateAndContinue(
              data.phone || '', 
              /^[\d\s\-\(\)]+$/, 
              'Please enter a valid phone number'
            )}
            placeholder="(512) 555-0123"
            type="tel"
            autoFocus
          />
        );

      case 'email':
        return (
          <QuestionBox
            icon={<Mail className="w-6 h-6" />}
            question="And your email address?"
            description="We'll send your appointment confirmation here"
            value={data.email || ''}
            onChange={(v) => setData({ ...data, email: v })}
            onEnter={() => validateAndContinue(
              data.email || '',
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              'Please enter a valid email address'
            )}
            placeholder="john@example.com"
            type="email"
            autoFocus
          />
        );

      case 'address':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="What's the service address?"
            description="Where do you need us to come?"
            value={data.address || ''}
            onChange={(v) => setData({ ...data, address: v })}
            onEnter={() => validateAndContinue(data.address || '')}
            placeholder="e.g., 123 Main Street"
            autoFocus
          />
        );

      case 'unit':
        return (
          <QuestionBox
            icon={<Building className="w-6 h-6" />}
            question="Apartment or unit number?"
            value={data.unit || ''}
            onChange={(v) => setData({ ...data, unit: v })}
            onEnter={() => handleAnswer(data.unit || '')}
            placeholder="e.g., Apt 4B (optional)"
            autoFocus
            optional
          />
        );

      case 'city':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="City?"
            value={data.city || ''}
            onChange={(v) => setData({ ...data, city: v })}
            onEnter={() => validateAndContinue(data.city || '')}
            placeholder="e.g., Austin"
            autoFocus
          />
        );

      case 'state':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="State?"
            value={data.state || ''}
            onChange={(v) => setData({ ...data, state: v.toUpperCase() })}
            onEnter={() => validateAndContinue(data.state || '')}
            placeholder="e.g., TX"
            maxLength={2}
            autoFocus
          />
        );

      case 'zip':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="ZIP code?"
            value={data.zip || ''}
            onChange={(v) => setData({ ...data, zip: v })}
            onEnter={() => validateAndContinue(
              data.zip || '',
              /^\d{5}(-\d{4})?$/,
              'Please enter a valid ZIP code (e.g., 78701)'
            )}
            placeholder="e.g., 78701"
            autoFocus
          />
        );

      case 'sameAsBilling':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-medium">Is the service location the same as your billing address?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We need to know where to send invoices
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 text-base"
                onClick={() => handleAnswer(true)}
                data-testid="button-same-address"
              >
                ✓ Yes, same address
              </Button>
              <Button
                variant="outline"
                className="h-16 text-base"
                onClick={() => handleAnswer(false)}
                data-testid="button-different-address"
              >
                Different billing address
              </Button>
            </div>
          </div>
        );

      case 'locationName':
        return (
          <QuestionBox
            icon={<Building className="w-6 h-6" />}
            question="What should we call this billing location?"
            description="A friendly name to help you identify it"
            value={data.locationName || ''}
            onChange={(v) => setData({ ...data, locationName: v })}
            onEnter={() => handleAnswer(data.locationName || '')}
            placeholder="e.g., Home Office, Downtown Warehouse"
            autoFocus
            optional
          />
        );

      case 'locationAddress':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="What's the billing address street?"
            value={data.locationAddress || ''}
            onChange={(v) => setData({ ...data, locationAddress: v })}
            onEnter={() => validateAndContinue(data.locationAddress || '')}
            placeholder="e.g., 456 Oak Avenue"
            autoFocus
          />
        );

      case 'locationUnit':
        return (
          <QuestionBox
            icon={<Building className="w-6 h-6" />}
            question="Billing address unit number?"
            value={data.locationUnit || ''}
            onChange={(v) => setData({ ...data, locationUnit: v })}
            onEnter={() => handleAnswer(data.locationUnit || '')}
            placeholder="e.g., Suite 200 (optional)"
            autoFocus
            optional
          />
        );

      case 'locationCity':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="Billing address city?"
            value={data.locationCity || ''}
            onChange={(v) => setData({ ...data, locationCity: v })}
            onEnter={() => validateAndContinue(data.locationCity || '')}
            placeholder="e.g., Austin"
            autoFocus
          />
        );

      case 'locationState':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="Billing address state?"
            value={data.locationState || ''}
            onChange={(v) => setData({ ...data, locationState: v.toUpperCase() })}
            onEnter={() => validateAndContinue(data.locationState || '')}
            placeholder="e.g., TX"
            maxLength={2}
            autoFocus
          />
        );

      case 'locationZip':
        return (
          <QuestionBox
            icon={<MapPin className="w-6 h-6" />}
            question="Billing address ZIP?"
            value={data.locationZip || ''}
            onChange={(v) => setData({ ...data, locationZip: v })}
            onEnter={() => validateAndContinue(
              data.locationZip || '',
              /^\d{5}(-\d{4})?$/,
              'Please enter a valid ZIP code'
            )}
            placeholder="e.g., 78701"
            autoFocus
          />
        );

      case 'grouponVoucher':
        return (
          <QuestionBox
            icon={<Ticket className="w-6 h-6" />}
            question="Do you have a Groupon voucher code?"
            value={data.grouponVoucher || ''}
            onChange={(v) => setData({ ...data, grouponVoucher: v })}
            onEnter={() => handleAnswer(data.grouponVoucher || '')}
            placeholder="e.g., GROUPON12345 (optional)"
            autoFocus
            optional
          />
        );

      case 'specialInstructions':
        return (
          <QuestionBox
            icon={<DoorClosed className="w-6 h-6" />}
            question="Any special access instructions?"
            description="Gate codes, parking info, or anything we should know"
            value={data.specialInstructions || ''}
            onChange={(v) => setData({ ...data, specialInstructions: v })}
            onEnter={() => {
              handleAnswer(data.specialInstructions || '');
              // This is the final step - submit
              onSubmit({ ...data, specialInstructions: data.specialInstructions });
            }}
            placeholder="e.g., Gate code #1234, use side entrance (optional)"
            autoFocus
            optional
          />
        );

      default:
        return null;
    }
  };

  const canGoBack = step !== 'problemDescription';

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {['problemDescription', 'firstName', 'phone', 'address', 'sameAsBilling', 'final'].map((milestone) => {
          const milestoneSteps: Record<string, ConversationStep[]> = {
            problemDescription: ['problemDescription'],
            firstName: ['firstName', 'lastName', 'customerType'],
            phone: ['phone', 'email'],
            address: ['address', 'unit', 'city', 'state', 'zip'],
            sameAsBilling: ['sameAsBilling', 'locationName', 'locationAddress', 'locationUnit', 'locationCity', 'locationState', 'locationZip'],
            final: ['grouponVoucher', 'specialInstructions'],
          };

          const isActive = milestoneSteps[milestone]?.includes(step);
          const isPassed = Object.keys(milestoneSteps)
            .indexOf(milestone) < Object.keys(milestoneSteps)
            .findIndex(key => milestoneSteps[key]?.includes(step));

          return (
            <div
              key={milestone}
              className={cn(
                "h-1.5 rounded-full transition-all",
                isActive ? "w-8 bg-primary" : isPassed ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
              )}
            />
          );
        })}
      </div>

      {/* Conversation area */}
      <div className="min-h-[200px]">
        {renderQuestion()}
        {error && (
          <p className="text-sm text-destructive mt-2 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {canGoBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        )}
        {!canGoBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        )}
        {canGoBack && step !== 'sameAsBilling' && step !== 'customerType' && (
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={isSubmitting}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface QuestionBoxProps {
  icon: React.ReactNode;
  question: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
  autoFocus?: boolean;
  optional?: boolean;
}

function QuestionBox({
  icon,
  question,
  description,
  value,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
  maxLength,
  autoFocus,
  optional,
}: QuestionBoxProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-medium">{question}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnter();
            }
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className="text-base h-11"
          data-testid={`input-${question.toLowerCase().replace(/[^a-z]+/g, '-')}`}
        />
        <Button onClick={onEnter} size="lg" data-testid="button-continue">
          {optional && !value ? 'Skip' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

interface QuestionBoxTextareaProps {
  icon: React.ReactNode;
  question: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder: string;
  autoFocus?: boolean;
  rows?: number;
}

function QuestionBoxTextarea({
  icon,
  question,
  description,
  value,
  onChange,
  onEnter,
  placeholder,
  autoFocus,
  rows = 3,
}: QuestionBoxTextareaProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-medium">{question}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={rows}
          className="text-base resize-none"
          data-testid={`textarea-${question.toLowerCase().replace(/[^a-z]+/g, '-')}`}
        />
        <Button onClick={onEnter} size="lg" className="w-full" data-testid="button-continue">
          {!value ? 'Skip' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
