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
  DollarSign, MapPin, User, Shield, LogOut, Loader2, Building, AlertCircle, CalendarClock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationSummary {
  id: number;
  name: string;
  address: string;
}

interface LocationDetails {
  id: number;
  name: string;
  address: string;
  appointments: any[];
  invoices: any[];
  memberships: any[];
}

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  locations: LocationSummary[];
  referrals: any[];
  credits: number;
}

interface PortalSession {
  customerId: number;
  availableCustomerIds: number[];
}

type VerificationStep = 'lookup' | 'verify-code' | 'authenticated';

export default function CustomerPortal() {
  const { toast } = useToast();
  
  // Authentication state
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('lookup');
  const [lookupType, setLookupType] = useState<'phone' | 'email'>('phone'); // Phone login is now default
  const [lookupValue, setLookupValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<PortalSession | null>(null);
  const [lookupToken, setLookupToken] = useState('');
  
  // Customer data
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Location-specific data (lazy loaded)
  const [locationData, setLocationData] = useState<Map<number, LocationDetails>>(new Map());
  const [loadingLocations, setLoadingLocations] = useState<Set<number>>(new Set());
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  // Referral submission state
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');
  const [referralEmail, setReferralEmail] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  
  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);
  
  // Load customer data when authenticated
  useEffect(() => {
    if (verificationStep === 'authenticated' && session?.customerId) {
      loadCustomerData(session.customerId);
    }
  }, [verificationStep, session?.customerId]);
  
  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/portal/session');
      if (response.ok) {
        const data = await response.json();
        if (data.customerId) {
          // Defensive: Ensure availableCustomerIds always exists
          const availableIds = Array.isArray(data.availableCustomerIds) && data.availableCustomerIds.length > 0
            ? data.availableCustomerIds
            : [data.customerId];
          
          setSession({
            customerId: data.customerId,
            availableCustomerIds: availableIds,
          });
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
        const customerIds = data.customers.map((c: any) => c.id);
        setSession({
          customerId: customerIds[0],
          availableCustomerIds: customerIds.length > 0 ? customerIds : [customerIds[0]],
        });
        setVerificationStep('authenticated');
        
        toast({
          title: 'Welcome!',
          description: data.customers.length > 1 
            ? `Found ${data.customers.length} accounts. You can switch between them.`
            : 'Successfully logged in to your portal.',
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
  
  const loadCustomerData = async (customerId: number) => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/portal/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load customer data');
      }
      
      const data = await response.json();
      setCustomerData(data);
      
      // Auto-select first location if available
      if (data.locations && data.locations.length > 0) {
        const firstLocationId = data.locations[0].id;
        setSelectedLocationId(firstLocationId);
        loadLocationDetails(customerId, firstLocationId);
      }
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
  
  const loadLocationDetails = async (customerId: number, locationId: number, forceRefresh: boolean = false) => {
    // Check if already loaded (unless force refresh)
    if (!forceRefresh && locationData.has(locationId)) {
      return;
    }
    
    // Check if already loading
    if (loadingLocations.has(locationId)) {
      return;
    }
    
    setLoadingLocations(prev => new Set(prev).add(locationId));
    
    try {
      const response = await fetch(
        `/api/portal/location-details?customerId=${customerId}&locationId=${locationId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load location details');
      }
      
      const data = await response.json();
      setLocationData(prev => new Map(prev).set(locationId, data));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to load location data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoadingLocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(locationId);
        return newSet;
      });
    }
  };
  
  const handleSwitchAccount = (customerId: number) => {
    if (session?.customerId !== customerId) {
      setSession(prev => prev ? { ...prev, customerId } : null);
      setCustomerData(null);
      setLocationData(new Map());
      setSelectedLocationId(null);
      loadCustomerData(customerId);
    }
  };
  
  const handleLocationTabChange = (locationId: string) => {
    const locId = parseInt(locationId, 10);
    setSelectedLocationId(locId);
    
    if (session?.customerId) {
      loadLocationDetails(session.customerId, locId);
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      setSession(null);
      setCustomerData(null);
      setLocationData(new Map());
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
          referrerName: customerData?.name || 'Customer',
          referrerEmail: customerData?.email || '',
          referrerPhone: customerData?.phone || '',
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
      
      setReferralName('');
      setReferralPhone('');
      setReferralEmail('');
      setShowReferralModal(false);
      
      if (session?.customerId) {
        loadCustomerData(session.customerId);
      }
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
  
  const handleOpenReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setRescheduleDate('');
    setAvailableSlots([]);
    setSelectedSlot(null);
  };
  
  const handleDateChange = async (date: string) => {
    setRescheduleDate(date);
    setAvailableSlots([]);
    setSelectedSlot(null);
    
    if (!date || !customerData) return;
    
    setIsLoadingSlots(true);
    try {
      // Fetch available slots for the selected date
      const response = await fetch('/api/scheduler/smart-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTypeId: 140551181, // Default plumbing job type
          customerZip: customerData.address ? extractZip(customerData.address) : undefined,
          startDate: date,
          daysToLoad: 1, // Just load one day
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load available slots');
      }
      
      setAvailableSlots(data.slots || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load available time slots',
        variant: 'destructive',
      });
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };
  
  const handleConfirmReschedule = async () => {
    if (!selectedAppointment || !selectedSlot) return;
    
    const slot = availableSlots.find(s => s.id === selectedSlot);
    if (!slot) return;
    
    setIsRescheduling(true);
    try {
      const response = await fetch('/api/portal/reschedule-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          jobId: selectedAppointment.jobId,
          newStart: slot.start,
          newEnd: slot.end,
          technicianId: slot.technicianId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }
      
      toast({
        title: 'Appointment Rescheduled!',
        description: `Your appointment has been moved to ${new Date(slot.start).toLocaleDateString()} ${slot.timeLabel}`,
      });
      
      // Reset state
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      
      // Reload location data with force refresh
      if (session?.customerId && selectedLocationId) {
        loadLocationDetails(session.customerId, selectedLocationId, true);
      }
    } catch (error: any) {
      toast({
        title: 'Reschedule Failed',
        description: error.message || 'Failed to reschedule appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRescheduling(false);
    }
  };
  
  const extractZip = (address: string): string | undefined => {
    const match = address.match(/\b\d{5}\b/);
    return match ? match[0] : undefined;
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
                <TabsTrigger value="phone" data-testid="tab-phone-login">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email-login">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="phone" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" data-testid="label-phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(512) 555-1234"
                    value={lookupValue}
                    onChange={(e) => setLookupValue(e.target.value)}
                    disabled={isLoading}
                    data-testid="input-phone"
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll send you a verification code via SMS
                  </p>
                </div>
                <Button
                  onClick={handleLookup}
                  disabled={isLoading || !lookupValue.trim()}
                  className="w-full"
                  data-testid="button-send-code"
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
  
  // Get current location data
  const currentLocation = selectedLocationId !== null ? locationData.get(selectedLocationId) : null;
  const isLoadingLocation = selectedLocationId !== null && loadingLocations.has(selectedLocationId);
  
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
                  Account #{session?.customerId}
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
          {/* Multi-Account Switcher */}
          {session && session.availableCustomerIds.length > 1 && (
            <Card className="mb-6" data-testid="card-account-switcher">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Your Accounts
                </CardTitle>
                <CardDescription>
                  You have {session.availableCustomerIds.length} accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {session.availableCustomerIds.map((id, idx) => (
                    <Button
                      key={id}
                      variant={id === session.customerId ? 'default' : 'outline'}
                      onClick={() => handleSwitchAccount(id)}
                      data-testid={`button-account-${id}`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {customerData && id === session.customerId 
                        ? customerData.name || `Account #${id}`
                        : `Account #${id}`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-data" />
            </div>
          ) : customerData ? (
            <div className="grid gap-6">
              {/* Location-Independent Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Account Overview</h2>
                
                {/* Contact Info */}
                <Card data-testid="card-contact-info">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{customerData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{customerData.phone}</span>
                    </div>
                    {customerData.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{customerData.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Referrals & Credits */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card data-testid="card-referrals">
                    <CardHeader>
                      <CardDescription>Your Referrals</CardDescription>
                      <CardTitle className="text-3xl">
                        {customerData.referrals?.length || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReferralModal(true)}
                        data-testid="button-submit-referral"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Refer a Friend
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card data-testid="card-credits">
                    <CardHeader>
                      <CardDescription>Referral Credits</CardDescription>
                      <CardTitle className="text-3xl text-primary">
                        ${customerData.credits || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Available for your next service
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              {/* Location Tabs */}
              {customerData.locations && customerData.locations.length > 0 && 
               customerData.locations.filter(loc => loc.id !== 0).length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Service Locations</h2>
                  
                  <Tabs 
                    value={selectedLocationId?.toString() || ''} 
                    onValueChange={handleLocationTabChange}
                  >
                    <TabsList className="w-full" data-testid="tabs-locations">
                      {customerData.locations
                        .filter(loc => loc.id !== 0)
                        .map((loc) => (
                          <TabsTrigger 
                            key={loc.id} 
                            value={loc.id.toString()}
                            data-testid={`tab-location-${loc.id}`}
                            className="flex-1"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            {loc.name}
                          </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {customerData.locations
                      .filter(loc => loc.id !== 0)
                      .map((loc) => (
                        <TabsContent key={loc.id} value={loc.id.toString()} className="space-y-4">
                        {isLoadingLocation && selectedLocationId === loc.id ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-location" />
                          </div>
                        ) : currentLocation && selectedLocationId === loc.id ? (
                          <>
                            {/* Location Address */}
                            <Card data-testid="card-location-address">
                              <CardHeader>
                                <CardTitle>{currentLocation.name}</CardTitle>
                                <CardDescription>
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  {currentLocation.address}
                                </CardDescription>
                              </CardHeader>
                            </Card>
                            
                            {/* Location Stats */}
                            <div className="grid sm:grid-cols-3 gap-4">
                              <Card data-testid="card-stat-appointments">
                                <CardHeader className="pb-3">
                                  <CardDescription>Upcoming Appointments</CardDescription>
                                  <CardTitle className="text-3xl">
                                    {currentLocation.appointments?.length || 0}
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
                                    {currentLocation.invoices?.length || 0}
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
                                    {currentLocation.memberships?.length || 0}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Shield className="w-4 h-4 text-muted-foreground" />
                                </CardContent>
                              </Card>
                            </div>
                            
                            {/* Appointments List */}
                            <Card data-testid="card-appointments-list">
                              <CardHeader>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>Your scheduled services at this location</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {currentLocation.appointments && currentLocation.appointments.length > 0 ? (
                                  <div className="space-y-4">
                                    {currentLocation.appointments.map((apt: any, idx: number) => (
                                      <div 
                                        key={apt.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg" 
                                        data-testid={`appointment-${idx}`}
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium">{apt.serviceName || 'Service'}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {apt.start ? new Date(apt.start).toLocaleDateString() : 'Date TBD'}
                                          </p>
                                          {apt.arrivalWindow && (
                                            <p className="text-sm text-muted-foreground">
                                              {apt.arrivalWindow}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge data-testid={`badge-appointment-status-${idx}`}>
                                            {apt.status || 'Scheduled'}
                                          </Badge>
                                          {apt.status === 'Scheduled' && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleOpenReschedule(apt)}
                                              data-testid={`button-reschedule-${idx}`}
                                            >
                                              <CalendarClock className="w-4 h-4 mr-2" />
                                              Reschedule
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-appointments">
                                    No appointments scheduled at this location
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                            
                            {/* Invoices List */}
                            <Card data-testid="card-invoices-list">
                              <CardHeader>
                                <CardTitle>Recent Invoices</CardTitle>
                                <CardDescription>Service history and payments at this location</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {currentLocation.invoices && currentLocation.invoices.length > 0 ? (
                                  <div className="space-y-4">
                                    {currentLocation.invoices.map((inv: any, idx: number) => (
                                      <div 
                                        key={inv.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg" 
                                        data-testid={`invoice-${idx}`}
                                      >
                                        <div>
                                          <p className="font-medium">Invoice #{inv.number}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {inv.date ? new Date(inv.date).toLocaleDateString() : 'Date unknown'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">${inv.total?.toFixed(2) || '0.00'}</p>
                                          <Badge variant={inv.paid ? 'default' : 'secondary'} data-testid={`badge-invoice-status-${idx}`}>
                                            {inv.paid ? 'Paid' : `Due: $${inv.balance?.toFixed(2) || '0.00'}`}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-invoices">
                                    No invoices found for this location
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                            
                            {/* Memberships List */}
                            {currentLocation.memberships && currentLocation.memberships.length > 0 && (
                              <Card data-testid="card-memberships-list">
                                <CardHeader>
                                  <CardTitle>Active Memberships</CardTitle>
                                  <CardDescription>Your membership plans at this location</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {currentLocation.memberships.map((mem: any, idx: number) => (
                                      <div 
                                        key={mem.id} 
                                        className="flex items-center justify-between p-4 border rounded-lg" 
                                        data-testid={`membership-${idx}`}
                                      >
                                        <div>
                                          <p className="font-medium">{mem.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {mem.startDate ? `Started: ${new Date(mem.startDate).toLocaleDateString()}` : ''}
                                          </p>
                                        </div>
                                        <Badge data-testid={`badge-membership-status-${idx}`}>
                                          {mem.status || 'Active'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">Click a location tab to view details</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ) : (
                <Card data-testid="card-no-locations">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No service locations found</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Referral Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent data-testid="dialog-referral">
          <DialogHeader>
            <DialogTitle>Refer a Friend</DialogTitle>
            <DialogDescription>
              Get rewarded when your friends use our services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-name">Friend's Name *</Label>
              <Input
                id="referral-name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="John Doe"
                data-testid="input-referral-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-phone">Friend's Phone *</Label>
              <Input
                id="referral-phone"
                type="tel"
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                placeholder="(512) 555-0123"
                data-testid="input-referral-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-email">Friend's Email (optional)</Label>
              <Input
                id="referral-email"
                type="email"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="friend@email.com"
                data-testid="input-referral-email"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReferralModal(false)}
                className="flex-1"
                data-testid="button-cancel-referral"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReferral}
                disabled={isSubmittingReferral || !referralName.trim() || !referralPhone.trim()}
                className="flex-1"
                data-testid="button-submit-referral-modal"
              >
                {isSubmittingReferral ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Submit Referral
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="max-w-2xl" data-testid="dialog-reschedule">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Current Appointment Info */}
              <Card data-testid="card-current-appointment">
                <CardHeader className="pb-3">
                  <CardDescription>Current Appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedAppointment.start ? new Date(selectedAppointment.start).toLocaleDateString() : 'Date TBD'}
                    </span>
                  </div>
                  {selectedAppointment.arrivalWindow && (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedAppointment.arrivalWindow}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAppointment.serviceName || 'Service'}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">Select New Date</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Today or later
                  data-testid="input-reschedule-date"
                />
              </div>
              
              {/* Loading Slots */}
              {isLoadingSlots && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-slots" />
                </div>
              )}
              
              {/* Available Slots */}
              {!isLoadingSlots && rescheduleDate && availableSlots.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Time Slots</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto" data-testid="slots-grid">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot === slot.id ? 'default' : 'outline'}
                        onClick={() => setSelectedSlot(slot.id)}
                        className="justify-start"
                        data-testid={`button-slot-${slot.id}`}
                      >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        {slot.timeLabel}
                        {slot.proximityScore > 75 && (
                          <Badge variant="secondary" className="ml-auto" data-testid={`badge-slot-score-${slot.id}`}>
                            Optimal
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No Slots Message */}
              {!isLoadingSlots && rescheduleDate && availableSlots.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-slots">
                    No available slots for this date. Please try another date.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1"
                  data-testid="button-cancel-reschedule"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReschedule}
                  disabled={!selectedSlot || isRescheduling}
                  className="flex-1"
                  data-testid="button-confirm-reschedule"
                >
                  {isRescheduling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Reschedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
