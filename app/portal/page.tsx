'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Mail, Phone, CheckCircle, Calendar, FileText, Gift, 
  DollarSign, MapPin, User, Shield, LogOut, Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  appointments: any[];
  invoices: any[];
  memberships: any[];
  referrals: any[];
  credits: number;
}

type VerificationStep = 'lookup' | 'verify-code' | 'authenticated';

export default function CustomerPortal() {
  const { toast } = useToast();
  
  // Authentication state
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('lookup');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('email');
  const [lookupValue, setLookupValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lookupToken, setLookupToken] = useState('');
  
  // Customer data
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Referral submission state
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');
  const [referralEmail, setReferralEmail] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  
  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);
  
  // Load customer data when authenticated
  useEffect(() => {
    if (verificationStep === 'authenticated' && customerId) {
      loadCustomerData();
    }
  }, [verificationStep, customerId]);
  
  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/portal/session');
      if (response.ok) {
        const data = await response.json();
        if (data.customerId) {
          setCustomerId(data.customerId.toString());
          setVerificationStep('authenticated');
        }
      }
    } catch (error) {
      console.log('[Portal] No active session found');
    }
  };
  
  const handleLookup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portal/auth/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookupType,
          lookupValue: lookupValue.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lookup failed');
      }
      
      // Store token for verification
      setLookupToken(data.token);
      setVerificationStep('verify-code');
      
      toast({
        title: 'Verification Code Sent',
        description: lookupType === 'email' 
          ? 'Check your email for the verification code.'
          : 'Check your phone for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: lookupValue.trim(),
          code: verificationCode.trim(),
          token: lookupToken,
          lookupType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      // Handle single or multiple accounts
      if (data.customers && data.customers.length > 0) {
        // For now, use first customer (TODO: add account selection UI)
        setCustomerId(data.customers[0].id.toString());
        setVerificationStep('authenticated');
        
        toast({
          title: 'Welcome!',
          description: 'Successfully logged in to your portal.',
        });
      } else {
        throw new Error('No customer account found');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadCustomerData = async () => {
    if (!customerId) return;
    
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/portal/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load customer data');
      }
      
      const data = await response.json();
      setCustomerData(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load your account data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      setCustomerId(null);
      setCustomerData(null);
      setVerificationStep('lookup');
      setLookupValue('');
      setVerificationCode('');
      setLookupToken('');
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('[Portal] Logout error:', error);
    }
  };
  
  const handleSubmitReferral = async () => {
    if (!referralName.trim() || !referralPhone.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least a name and phone number.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmittingReferral(true);
    try {
      const response = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Referrer info (logged-in customer)
          referrerName: customerData?.name || 'Customer',
          referrerEmail: customerData?.email || '',
          referrerPhone: customerData?.phone || '',
          // Referee info (friend being referred)
          refereeName: referralName.trim(),
          refereePhone: referralPhone.trim(),
          refereeEmail: referralEmail.trim() || '',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit referral');
      }
      
      toast({
        title: 'Referral Submitted!',
        description: 'Thank you for referring a friend. We\'ll contact them soon!',
      });
      
      // Reset form and close modal
      setReferralName('');
      setReferralPhone('');
      setReferralEmail('');
      setShowReferralModal(false);
      
      // Reload customer data to refresh referrals list
      loadCustomerData();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit referral. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReferral(false);
    }
  };
  
  // Login UI
  if (verificationStep === 'lookup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <Card className="w-full max-w-md" data-testid="card-portal-login">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl" data-testid="text-portal-title">
                Customer Portal
              </CardTitle>
              <CardDescription data-testid="text-portal-subtitle">
                Sign in to view your service history and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={lookupType} onValueChange={(v) => setLookupType(v as 'phone' | 'email')}>
                <TabsList className="grid w-full grid-cols-2" data-testid="tabs-login-method">
                  <TabsTrigger value="email" data-testid="tab-email-login">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" data-testid="tab-phone-login">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" data-testid="label-email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      data-testid="input-email"
                    />
                  </div>
                  <Button
                    onClick={handleLookup}
                    disabled={isLoading || !lookupValue.trim()}
                    className="w-full"
                    data-testid="button-send-email-code"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" data-testid="label-phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(512) 555-0123"
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      data-testid="input-phone"
                    />
                  </div>
                  <Button
                    onClick={handleLookup}
                    disabled={isLoading || !lookupValue.trim()}
                    className="w-full"
                    data-testid="button-send-phone-code"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Send Verification Code
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>We'll send you a secure code to verify your identity</p>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }
  
  // Verification code UI
  if (verificationStep === 'verify-code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <Card className="w-full max-w-md" data-testid="card-verify-code">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl" data-testid="text-verify-title">
                Verify Your Code
              </CardTitle>
              <CardDescription data-testid="text-verify-subtitle">
                Enter the code we sent to {lookupValue}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" data-testid="label-code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                  data-testid="input-code"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationStep('lookup');
                    setVerificationCode('');
                  }}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading || !verificationCode.trim()}
                  className="flex-1"
                  data-testid="button-verify"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleLookup}
                  disabled={isLoading}
                  data-testid="button-resend"
                >
                  Resend Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }
  
  // Dashboard UI (authenticated)
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-welcome">
                  Welcome{customerData?.name ? `, ${customerData.name}` : ''}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="text-account-id">
                  Account #{customerId}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-data" />
            </div>
          ) : customerData ? (
            <div className="grid gap-6">
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-stat-appointments">
                  <CardHeader className="pb-3">
                    <CardDescription>Upcoming Appointments</CardDescription>
                    <CardTitle className="text-3xl">
                      {customerData.appointments?.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-invoices">
                  <CardHeader className="pb-3">
                    <CardDescription>Recent Invoices</CardDescription>
                    <CardTitle className="text-3xl">
                      {customerData.invoices?.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-memberships">
                  <CardHeader className="pb-3">
                    <CardDescription>Memberships</CardDescription>
                    <CardTitle className="text-3xl">
                      {customerData.memberships?.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                
                <Card data-testid="card-stat-credits">
                  <CardHeader className="pb-3">
                    <CardDescription>Referral Credits</CardDescription>
                    <CardTitle className="text-3xl">
                      ${customerData.credits || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Gift className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
              
              {/* Tabs for different sections */}
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid w-full grid-cols-4" data-testid="tabs-sections">
                  <TabsTrigger value="appointments" data-testid="tab-appointments">
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="invoices" data-testid="tab-invoices">
                    Invoices
                  </TabsTrigger>
                  <TabsTrigger value="memberships" data-testid="tab-memberships">
                    Memberships
                  </TabsTrigger>
                  <TabsTrigger value="referrals" data-testid="tab-referrals">
                    Referrals
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="appointments" className="space-y-4">
                  <Card data-testid="card-appointments-list">
                    <CardHeader>
                      <CardTitle>Your Appointments</CardTitle>
                      <CardDescription>View and manage your scheduled services</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customerData.appointments?.length > 0 ? (
                        <div className="space-y-4">
                          {customerData.appointments.map((apt: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`appointment-${idx}`}>
                              <div>
                                <p className="font-medium">{apt.serviceName || 'Service'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {apt.start ? new Date(apt.start).toLocaleDateString() : 'Date TBD'}
                                </p>
                              </div>
                              <Badge data-testid={`badge-appointment-status-${idx}`}>
                                {apt.status || 'Scheduled'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8" data-testid="text-no-appointments">
                          No appointments scheduled
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="invoices" className="space-y-4">
                  <Card data-testid="card-invoices-list">
                    <CardHeader>
                      <CardTitle>Your Invoices</CardTitle>
                      <CardDescription>View your service history and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customerData.invoices?.length > 0 ? (
                        <div className="space-y-4">
                          {customerData.invoices.map((inv: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`invoice-${idx}`}>
                              <div>
                                <p className="font-medium">Invoice #{inv.number || idx + 1}</p>
                                <p className="text-sm text-muted-foreground">
                                  {inv.date ? new Date(inv.date).toLocaleDateString() : 'Date unknown'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${inv.total || '0.00'}</p>
                                <Badge variant={inv.paid ? 'default' : 'secondary'} data-testid={`badge-invoice-status-${idx}`}>
                                  {inv.paid ? 'Paid' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8" data-testid="text-no-invoices">
                          No invoices available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="memberships" className="space-y-4">
                  <Card data-testid="card-memberships-list">
                    <CardHeader>
                      <CardTitle>Your Memberships</CardTitle>
                      <CardDescription>Active membership plans and benefits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customerData.memberships?.length > 0 ? (
                        <div className="space-y-4">
                          {customerData.memberships.map((mem: any, idx: number) => (
                            <div key={idx} className="p-4 border rounded-lg" data-testid={`membership-${idx}`}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">{mem.name || 'VIP Membership'}</p>
                                <Badge data-testid={`badge-membership-status-${idx}`}>
                                  {mem.status || 'Active'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Expires: {mem.expiresAt ? new Date(mem.expiresAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4" data-testid="text-no-memberships">
                            No active memberships
                          </p>
                          <Button variant="outline" data-testid="button-learn-membership">
                            Learn About VIP Membership
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="referrals" className="space-y-4">
                  <Card data-testid="card-referrals-list">
                    <CardHeader>
                      <CardTitle>Your Referrals</CardTitle>
                      <CardDescription>
                        Track your referrals and earn ${customerData.credits || 0} in credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-accent/10 rounded-lg text-center">
                          <Gift className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="font-medium mb-1">Refer friends and earn rewards!</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Get $25 off your next service for every referral
                          </p>
                          <Button 
                            onClick={() => setShowReferralModal(true)}
                            data-testid="button-submit-referral"
                          >
                            Submit a Referral
                          </Button>
                        </div>
                        
                        {customerData.referrals?.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="font-medium text-sm">Your Referrals</h3>
                            {customerData.referrals.map((ref: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`referral-${idx}`}>
                                <div>
                                  <p className="font-medium text-sm">{ref.name}</p>
                                  <p className="text-xs text-muted-foreground">{ref.status}</p>
                                </div>
                                <Badge variant="secondary" data-testid={`badge-referral-status-${idx}`}>
                                  {ref.credited ? 'Credited' : 'Pending'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground" data-testid="text-no-data">
                  Unable to load account data
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Referral Submission Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent data-testid="dialog-referral-submission">
          <DialogHeader>
            <DialogTitle data-testid="text-referral-modal-title">Submit a Referral</DialogTitle>
            <DialogDescription data-testid="text-referral-modal-description">
              Refer a friend and earn $25 off your next service!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-name" data-testid="label-referral-name">
                Friend's Name *
              </Label>
              <Input
                id="referral-name"
                placeholder="John Doe"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                data-testid="input-referral-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referral-phone" data-testid="label-referral-phone">
                Friend's Phone *
              </Label>
              <Input
                id="referral-phone"
                type="tel"
                placeholder="(512) 555-0123"
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                data-testid="input-referral-phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referral-email" data-testid="label-referral-email">
                Friend's Email (Optional)
              </Label>
              <Input
                id="referral-email"
                type="email"
                placeholder="friend@example.com"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                data-testid="input-referral-email"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowReferralModal(false)}
                disabled={isSubmittingReferral}
                className="flex-1"
                data-testid="button-cancel-referral"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReferral}
                disabled={isSubmittingReferral || !referralName.trim() || !referralPhone.trim()}
                className="flex-1"
                data-testid="button-submit-referral-form"
              >
                {isSubmittingReferral ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Referral'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
