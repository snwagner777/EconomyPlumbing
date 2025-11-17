'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, CheckCircle, AlertCircle, User, MapPin } from 'lucide-react';
import type { VerificationStep, CustomerAccount } from './types';

interface CustomerPortalAuthProps {
  onAuthenticated: (customerId: string, availableCustomerIds: number[]) => void;
  onError?: (message: string) => void;
}

export function CustomerPortalAuth({ onAuthenticated, onError }: CustomerPortalAuthProps) {
  const { toast } = useToast();
  
  // Auth state
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('phone-lookup');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [phoneLoginNumber, setPhoneLoginNumber] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [actualEmail, setActualEmail] = useState('');
  const [lookupToken, setLookupToken] = useState('');
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<CustomerAccount[]>([]);
  const [availableEmails, setAvailableEmails] = useState<Array<{ masked: string; value: string }>>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  
  // UI state
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle magic link verification on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    
    if (token) {
      handleMagicLinkVerification(token);
    }
  }, []);

  const handleMagicLinkVerification = async (token: string) => {
    setIsVerifying(true);
    setLookupError(null);

    try {
      const response = await fetch('/api/portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: '',
          code: token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid or expired magic link');
      }

      const result = await response.json();
      
      if (result.customers && result.customers.length > 1) {
        // Pass ALL customer IDs to parent for account switching
        const allIds = result.customers.map((c: any) => c.id);
        setAvailableAccounts(result.customers);
        setVerificationStep('select-account');
        setLookupSuccess("Please select which account you'd like to access");
      } else if (result.customers && result.customers.length === 1) {
        onAuthenticated(result.customers[0].id.toString(), [result.customers[0].id]);
      } else if (result.customerId) {
        onAuthenticated(result.customerId.toString(), [result.customerId]);
      } else {
        throw new Error('No customer data returned');
      }
      
      setLookupError(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Magic link verification failed:', error);
      const errorMessage = error.message || "The magic link is invalid or has expired. Please try again.";
      setLookupError(errorMessage);
      if (onError) onError(errorMessage);
      setLookupSuccess(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    
    setLookupError(null);
    setLookupSuccess(null);
    setIsSearching(true);

    try {
      const verificationType = lookupType === 'phone' ? 'sms' : 'email';
      
      const response = await fetch('/api/portal/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: lookupValue,
          verificationType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Customer not found');
      }

      const result = await response.json();
      
      if (result.requiresEmailSelection && result.emails) {
        setAvailableEmails(result.emails);
        setVerificationStep('select-email');
        setLookupSuccess(result.message);
      } else {
        setVerificationStep('verify-code');
        setVerificationMessage(result.message);
        setLookupSuccess(result.message);
      }
    } catch (err: any) {
      console.error('Customer lookup failed:', err);
      const errorMsg = err.message || 'We couldn\'t find an account with that information. Please verify and try again.';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhoneLookup = async () => {
    if (!phoneLoginNumber.trim()) return;
    
    setLookupError(null);
    setLookupSuccess(null);
    setIsLookingUp(true);

    try {
      const response = await fetch('/api/portal/auth/lookup-by-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneLoginNumber }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Account not found');
      }

      const result = await response.json();
      
      // Check if no account was found
      if (result.found === false) {
        throw new Error(result.message || 'No account found with this phone number');
      }
      
      if (result.requiresAccountSelection && result.customers) {
        // Store accounts but DON'T show selector yet - verify 2FA first
        const normalizedPhone = result.phone || phoneLoginNumber;
        setPhoneLoginNumber(normalizedPhone);
        setLookupValue(normalizedPhone);
        setLookupType('phone');
        setLookupToken(result.lookupToken || '');
        
        const accounts: CustomerAccount[] = result.customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          maskedEmail: c.maskedEmail,
          phoneNumber: normalizedPhone,
        }));
        
        // Store accounts for post-verification selector
        setAvailableAccounts(accounts);
        
        // Go straight to verification step - selector shows AFTER 2FA
        setVerificationStep('phone-email-found');
        setLookupSuccess(`We found ${accounts.length} accounts. We'll send a verification code via SMS to ${normalizedPhone}`);
      } else if (result.requiresEmailSelection && result.emails) {
        setAvailableEmails(result.emails);
        setLookupToken(result.lookupToken);
        setVerificationStep('select-email');
        setLookupSuccess('We found your account! Please select which email to use for verification.');
      } else if (result.verificationType === 'sms') {
        setLookupToken(result.lookupToken || '');
        setLookupValue(result.phone || phoneLoginNumber);
        setLookupType('phone');
        setVerificationStep('phone-email-found');
        setLookupSuccess(`We found your account! We'll send a verification code via SMS to ${result.phone || phoneLoginNumber}`);
      } else {
        setMaskedEmail(result.maskedEmail || result.maskedContact);
        setActualEmail(result.email);
        setLookupToken(result.lookupToken);
        setLookupValue(result.phone || phoneLoginNumber);
        setLookupType('phone');
        setVerificationStep('phone-email-found');
        setLookupSuccess(`We found your account! We'll send a verification code via SMS to ${result.phone || phoneLoginNumber}`);
      }
    } catch (err: any) {
      console.error('Phone lookup failed:', err);
      const errorMsg = err.message || 'We couldn\'t find an account with that phone number.';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSendPhoneVerificationCode = async () => {
    setLookupError(null);
    setLookupSuccess(null);
    setIsSendingLink(true);

    try {
      const phoneToVerify = lookupValue || phoneLoginNumber;
      
      const response = await fetch('/api/portal/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: phoneToVerify,
          verificationType: 'sms',
          lookupToken: lookupToken || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send verification code');
      }

      const result = await response.json();
      
      setLookupValue(phoneToVerify);
      setLookupType('phone');
      setVerificationStep('verify-code');
      setLookupSuccess(result.message || `Verification code sent via SMS!`);
      toast({
        title: "Check your phone!",
        description: `We've sent a 6-digit code to ${phoneToVerify}`,
      });
    } catch (err: any) {
      console.error('Send verification code failed:', err);
      const errorMsg = err.message || 'Failed to send verification code. Please try again.';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleSelectEmail = async () => {
    if (!selectedEmail) {
      setLookupError('Please select an email address');
      return;
    }
    
    setLookupError(null);
    setLookupSuccess(null);
    setIsSearching(true);

    try {
      const response = await fetch('/api/portal/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: selectedEmail,
          verificationType: 'email',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send verification code');
      }

      const result = await response.json();
      
      setLookupValue(selectedEmail);
      setVerificationStep('verify-code');
      setVerificationMessage(result.message);
      setLookupSuccess(result.message);
    } catch (err: any) {
      console.error('Email send failed:', err);
      const errorMsg = err.message || 'Failed to send verification code';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;
    
    setLookupError(null);
    setLookupSuccess(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: lookupValue,
          code: verificationCode,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid verification code');
      }

      const result = await response.json();
      
      if (pendingAccountId) {
        // Get all customer IDs from availableAccounts if we have them
        const allIds = availableAccounts.length > 0 ? availableAccounts.map(a => a.id) : [parseInt(pendingAccountId)];
        onAuthenticated(pendingAccountId, allIds);
        setPendingAccountId(null);
      } else if (result.customers && result.customers.length > 1) {
        // Pass ALL customer IDs to parent for account switching
        const allIds = result.customers.map((c: any) => c.id);
        setAvailableAccounts(result.customers);
        setVerificationStep('select-account');
        setLookupSuccess("Please select which account you'd like to access");
      } else if (result.customers && result.customers.length === 1) {
        onAuthenticated(result.customers[0].id.toString(), [result.customers[0].id]);
      } else if (result.customerId) {
        onAuthenticated(result.customerId.toString(), [result.customerId]);
      } else {
        throw new Error('No customer data returned');
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      const errorMsg = err.message || 'Invalid verification code. Please try again.';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectAccount = async (accountId: number) => {
    try {
      const selectedAccount = availableAccounts.find(a => a.id === accountId);
      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }

      // CRITICAL FIX: If we're at select-account step, user already verified
      // Just complete login immediately - NO second verification code!
      if (verificationStep === 'select-account') {
        const allIds = availableAccounts.map(a => a.id);
        onAuthenticated(accountId.toString(), allIds);
        return;
      }

      // If this is post-auth account switching, just notify parent immediately
      if (verificationStep !== 'select-account') {
        const allIds = availableAccounts.map(a => a.id);
        onAuthenticated(accountId.toString(), allIds);
        return;
      }
    } catch (error: any) {
      console.error('Account select error:', error);
      const errorMsg = 'Failed to select account. Please try again.';
      setLookupError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const handleBackToLookup = () => {
    setVerificationStep('lookup');
    setLookupType('email'); // CRITICAL: Set to email when switching to email lookup
    setVerificationCode('');
    setLookupError(null);
    setVerificationMessage('');
    setPhoneLoginNumber('');
    setMaskedEmail('');
    setActualEmail('');
    setLookupToken('');
  };

  // Render auth UI based on step
  if (verificationStep === 'lookup') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Find Your Account</CardTitle>
          <CardDescription>Enter your email address to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lookup-input">Email Address</Label>
            <Input
              id="lookup-input"
              type="email"
              placeholder="your@email.com"
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              data-testid="input-lookup"
            />
          </div>

          <Button
            onClick={handleLookup}
            className="w-full"
            disabled={!lookupValue.trim() || isSearching}
            data-testid="button-lookup-submit"
          >
            {isSearching ? 'Searching...' : 'Send Verification Code'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setVerificationStep('phone-lookup');
              setLookupType('phone'); // CRITICAL: Set to phone when switching to phone lookup
            }}
            className="w-full"
            data-testid="button-back-to-phone"
          >
            <Phone className="w-4 h-4 mr-2" />
            Use Phone Instead
          </Button>

          {lookupSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium mb-1">Success</p>
                  <p>{lookupSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {lookupError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-destructive">
                  <p className="font-medium mb-1">Error</p>
                  <p>{lookupError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (verificationStep === 'phone-lookup') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login with Phone Number</CardTitle>
          <CardDescription>Enter your phone number and we'll send a verification code via SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-lookup-input">Phone Number</Label>
            <Input
              id="phone-lookup-input"
              type="tel"
              placeholder="(512) 555-1234"
              value={phoneLoginNumber}
              onChange={(e) => setPhoneLoginNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
              data-testid="input-phone-lookup"
            />
          </div>

          <Button
            onClick={handlePhoneLookup}
            className="w-full"
            disabled={!phoneLoginNumber.trim() || isLookingUp}
            data-testid="button-phone-lookup-submit"
          >
            {isLookingUp ? 'Looking up...' : 'Find My Account'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleBackToLookup}
            className="w-full"
            data-testid="button-use-email"
          >
            <Mail className="w-4 h-4 mr-2" />
            Use Email Instead
          </Button>

          {lookupSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium mb-1">Success</p>
                  <p>{lookupSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {lookupError && (
            <>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-destructive">
                    <p className="font-medium mb-1">Error</p>
                    <p>{lookupError}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Don't have an account yet? We'd love to serve you!
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/contact?ref=portal-signup';
                  }}
                  className="w-full"
                  data-testid="button-create-account"
                >
                  <User className="w-4 h-4 mr-2" />
                  Create New Account
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (verificationStep === 'phone-email-found') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Account Found!</CardTitle>
          <CardDescription>We'll send a verification code via SMS to your phone number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Phone Number</p>
                <p className="text-sm text-muted-foreground">{phoneLoginNumber}</p>
                <p className="text-xs text-muted-foreground mt-2">We'll text a 6-digit code to this number</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSendPhoneVerificationCode}
            className="w-full"
            disabled={isSendingLink}
            data-testid="button-send-phone-verification-code"
          >
            {isSendingLink ? 'Sending...' : 'Send Verification Code'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBackToLookup}
            className="w-full"
            data-testid="button-back-from-phone"
          >
            Use Different Method
          </Button>

          {lookupSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium mb-1">Success</p>
                  <p>{lookupSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {lookupError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-destructive">
                  <p className="font-medium mb-1">Error</p>
                  <p>{lookupError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (verificationStep === 'select-email') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Select Email Address</CardTitle>
          <CardDescription>Multiple email addresses found. Choose which one to send the verification code to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Available Email Addresses</Label>
            <div className="space-y-2">
              {availableEmails.map((emailOption, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEmail(emailOption.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedEmail === emailOption.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                  data-testid={`button-select-email-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{emailOption.masked}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmail === emailOption.value ? 'Selected' : 'Click to select'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">For security, parts of the email addresses are hidden</p>
          </div>

          <Button
            onClick={handleSelectEmail}
            className="w-full"
            disabled={!selectedEmail || isSearching}
            data-testid="button-send-to-selected-email"
          >
            {isSearching ? 'Sending...' : 'Send Code to Selected Email'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setVerificationStep('lookup');
              setSelectedEmail('');
              setAvailableEmails([]);
            }}
            className="w-full"
            data-testid="button-back-from-email-select"
          >
            Use Different Phone Number
          </Button>

          {lookupSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium mb-1">Success</p>
                  <p>{lookupSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {lookupError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-destructive">
                  <p className="font-medium mb-1">Error</p>
                  <p>{lookupError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (verificationStep === 'verify-code') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Enter Verification Code</CardTitle>
          <CardDescription>{verificationMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">6-Digit Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-semibold"
              data-testid="input-verification-code"
            />
            <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to {lookupValue}</p>
          </div>

          <Button
            onClick={handleVerifyCode}
            className="w-full"
            disabled={verificationCode.length !== 6 || isVerifying}
            data-testid="button-verify-code"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Access Portal'}
          </Button>

          <Button
            variant="outline"
            onClick={handleBackToLookup}
            className="w-full"
            data-testid="button-back-to-lookup"
          >
            Use Different Email
          </Button>

          {lookupSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-green-700 dark:text-green-400">
                  <p className="font-medium mb-1">Success</p>
                  <p>{lookupSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {lookupError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-destructive">
                  <p className="font-medium mb-1">Error</p>
                  <p>{lookupError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (verificationStep === 'select-account') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Select Your Account</CardTitle>
          <CardDescription>
            We found multiple accounts associated with your contact information. Please select which account you'd like to access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableAccounts.map((account) => (
            <Card
              key={account.id}
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => handleSelectAccount(account.id)}
              data-testid={`account-option-${account.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <User className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{account.name}</p>
                    {account.address && (
                      <p className="text-sm text-muted-foreground flex items-start gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {account.address}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={handleBackToLookup}
            className="w-full mt-4"
            data-testid="button-back-to-lookup-from-select"
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
