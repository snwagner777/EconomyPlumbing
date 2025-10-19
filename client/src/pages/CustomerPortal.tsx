import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { ReferralModal } from "@/components/ReferralModal";
import { 
  User,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone as PhoneIcon,
  Mail,
  Hash,
  Gift,
  Heart,
  Crown,
  Star,
  Shield,
  Wrench,
  MapPin,
  Home,
  MessageSquare,
  Share2,
  Copy,
  Check,
  TrendingUp,
  CalendarClock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiFacebook, SiX } from "react-icons/si";

interface ServiceTitanCustomer {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface ServiceTitanAppointment {
  id: number;
  start: string;
  end: string;
  status: string;
  arrivalWindowStart?: string;
  arrivalWindowEnd?: string;
  jobType: string;
  jobNumber?: string;
  summary?: string;
}

interface ServiceTitanInvoice {
  id: number;
  invoiceNumber: string;
  total: number;
  balance: number;
  status: string;
  createdOn: string;
  dueDate?: string;
  jobNumber?: string;
  summary?: string;
}

interface ServiceTitanMembership {
  id: number;
  membershipType: string;
  status: string;
  startDate: string;
  expirationDate?: string;
  renewalDate?: string;
  balance: number;
  totalValue: number;
  description: string;
}

interface ServiceTitanEstimate {
  id: number;
  estimateNumber: string;
  total: number;
  status: string;
  createdOn: string;
  expiresOn?: string;
  jobId?: number;
  jobNumber?: string;
  summary: string;
  items?: any[];
}

interface CustomerData {
  customer: ServiceTitanCustomer;
  appointments: ServiceTitanAppointment[];
  invoices: ServiceTitanInvoice[];
  memberships: ServiceTitanMembership[];
  estimates: ServiceTitanEstimate[];
}

interface CustomerAccount {
  id: number;
  name: string;
  type: string;
  address?: string;
}

export default function CustomerPortal() {
  const [lookupValue, setLookupValue] = useState("");
  const [lookupType, setLookupType] = useState<"phone" | "email">("email");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Multi-account support
  const [availableAccounts, setAvailableAccounts] = useState<CustomerAccount[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  
  // Verification state
  const [verificationStep, setVerificationStep] = useState<'lookup' | 'verify-code' | 'select-account' | 'authenticated'>('lookup');
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Reschedule state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<ServiceTitanAppointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState("");
  const [newAppointmentWindow, setNewAppointmentWindow] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  const phoneConfig = usePhoneConfig();
  const { toast } = useToast();

  const { data: customerData, isLoading, error } = useQuery<CustomerData>({
    queryKey: ['/api/servicetitan/customer', customerId],
    enabled: !!customerId,
  });

  // Fetch referrals for this customer
  const { data: referralsData } = useQuery<{ referrals: any[] }>({
    queryKey: ['/api/referrals/customer', customerId],
    enabled: !!customerId,
  });

  // Fetch referral code and link for this customer
  const { data: referralLinkData } = useQuery<{
    code: string;
    url: string;
    clicks: number;
    conversions: number;
  }>({
    queryKey: ['/api/referrals/code', customerId],
    enabled: !!customerId,
  });

  // Fetch arrival windows from ServiceTitan
  const { data: arrivalWindowsData } = useQuery<{
    windows: Array<{ start: string; end: string; label: string }>;
  }>({
    queryKey: ['/api/servicetitan/arrival-windows'],
  });

  // Fetch customer stats (service count and percentile ranking)
  const { data: customerStats } = useQuery<{
    serviceCount: number;
    topPercentile: number;
  }>({
    queryKey: ['/api/portal/customer-stats', customerId],
    enabled: !!customerId,
  });

  const timeWindows = arrivalWindowsData?.windows || [];

  // Separate upcoming and completed appointments
  const upcomingAppointments = customerData?.appointments.filter(apt => {
    const isUpcoming = new Date(apt.start) > new Date();
    const isNotCompleted = !['Done', 'Completed', 'Cancelled'].includes(apt.status);
    return isUpcoming && isNotCompleted;
  }) || [];

  const completedAppointments = customerData?.appointments.filter(apt => {
    const isPast = new Date(apt.start) <= new Date();
    const isCompleted = ['Done', 'Completed', 'Cancelled'].includes(apt.status);
    return isPast || isCompleted;
  }) || [];

  // Check for magic link token OR server session on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Auto-verify email magic link
      handleMagicLinkVerification(token);
    } else {
      // Check if server has an active session
      checkExistingSession();
    }
  }, []);
  
  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/portal/session');
      if (response.ok) {
        const data = await response.json();
        if (data.customerId) {
          console.log('[Portal] Found active session, auto-logging in...');
          setCustomerId(data.customerId.toString());
          setVerificationStep('authenticated');
        }
      }
    } catch (error) {
      console.log('[Portal] No active session found');
    }
  };

  const handleMagicLinkVerification = async (token: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/portal/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: '', // Token-based verification doesn't need contact value
          code: token,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid or expired magic link');
      }

      const result = await response.json();
      const customerIdStr = result.customerId.toString();
      setCustomerId(customerIdStr);
      setVerificationStep('authenticated');
      
      // Session is now stored server-side via httpOnly cookie
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Access granted",
        description: "Welcome to your customer portal!",
      });
    } catch (error) {
      console.error('Magic link verification failed:', error);
      toast({
        title: "Verification failed",
        description: "The magic link is invalid or has expired. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    
    setLookupError(null);
    setIsSearching(true);

    try {
      // For phone/email, send verification code
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
      
      // Move to verification step
      setVerificationStep('verify-code');
      setVerificationMessage(result.message);
      
      toast({
        title: "Verification sent",
        description: result.message,
      });
    } catch (err: any) {
      console.error('Customer lookup failed:', err);
      setLookupError(err.message || 'We couldn\'t find an account with that email address. Please verify your email and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;
    
    setLookupError(null);
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
      
      // Check if multiple accounts exist
      if (result.customers && result.customers.length > 1) {
        setAvailableAccounts(result.customers);
        setVerificationStep('select-account');
        toast({
          title: "Multiple accounts found",
          description: "Please select which account you'd like to access",
        });
      } else if (result.customers && result.customers.length === 1) {
        // Single account - auto-select it
        const customerIdStr = result.customers[0].id.toString();
        setCustomerId(customerIdStr);
        setVerificationStep('authenticated');
        
        // Session is now stored server-side via httpOnly cookie
        
        toast({
          title: "Access granted",
          description: "Welcome to your customer portal!",
        });
      } else if (result.customerId) {
        // Backward compatibility for old response format
        const customerIdStr = result.customerId.toString();
        setCustomerId(customerIdStr);
        setVerificationStep('authenticated');
        
        // Session is now stored server-side via httpOnly cookie
        toast({
          title: "Access granted",
          description: "Welcome to your customer portal!",
        });
      } else {
        throw new Error('No customer data returned');
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      setLookupError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectAccount = (accountId: number) => {
    setCustomerId(accountId.toString());
    setVerificationStep('authenticated');
    setShowAccountSelection(false);
    
    // Store selected account for future reference
    localStorage.setItem('selectedAccountId', accountId.toString());
    
    toast({
      title: "Account selected",
      description: "Welcome to your customer portal!",
    });
  };

  const handleSwitchAccount = () => {
    if (availableAccounts.length > 1) {
      setShowAccountSelection(true);
    }
  };

  const handleBackToLookup = () => {
    setVerificationStep('lookup');
    setVerificationCode("");
    setLookupError(null);
    setVerificationMessage("");
  };

  const handleOpenRescheduleDialog = (appointment: ServiceTitanAppointment) => {
    setAppointmentToReschedule(appointment);
    
    // Pre-fill with current appointment date
    const appointmentDate = new Date(appointment.start);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    setNewAppointmentDate(dateStr);
    
    // Pre-select time window based on current appointment's arrival window
    if (appointment.arrivalWindowStart && appointment.arrivalWindowEnd && timeWindows.length > 0) {
      const startTime = new Date(appointment.arrivalWindowStart);
      const endTime = new Date(appointment.arrivalWindowEnd);
      
      const startStr = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;
      const endStr = `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}`;
      
      // Find matching window
      const matchingWindow = timeWindows.find(w => w.start === startStr && w.end === endStr);
      if (matchingWindow) {
        setNewAppointmentWindow(`${matchingWindow.start}-${matchingWindow.end}`);
      } else if (timeWindows.length > 0) {
        // Default to first window if no match
        setNewAppointmentWindow(`${timeWindows[0].start}-${timeWindows[0].end}`);
      }
    } else if (timeWindows.length > 0) {
      // Default to first window
      setNewAppointmentWindow(`${timeWindows[0].start}-${timeWindows[0].end}`);
    }
    
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    if (!appointmentToReschedule || !newAppointmentDate || !newAppointmentWindow || !customerId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select both a date and time window for your appointment.",
      });
      return;
    }

    setIsRescheduling(true);

    try {
      // Parse the selected window (format: "HH:MM-HH:MM")
      const [startTime, endTime] = newAppointmentWindow.split('-');
      
      // Find the matching window to get the label
      const selectedWindow = timeWindows.find(w => `${w.start}-${w.end}` === newAppointmentWindow);
      
      if (!selectedWindow) {
        throw new Error("Invalid time window selected");
      }

      // Combine date and window times into ISO strings
      const newStartDateTime = new Date(`${newAppointmentDate}T${startTime}:00`);
      const newEndDateTime = new Date(`${newAppointmentDate}T${endTime}:00`);

      const response = await fetch('/api/portal/reschedule-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentToReschedule.id,
          newStart: newStartDateTime.toISOString(),
          newEnd: newEndDateTime.toISOString(),
          customerId: customerId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule appointment');
      }

      toast({
        title: "Appointment Rescheduled!",
        description: `Your appointment has been moved to ${newStartDateTime.toLocaleDateString()} (${selectedWindow.label}).`,
      });

      // Refresh customer data
      window.location.reload();
      
      setRescheduleDialogOpen(false);
    } catch (error: any) {
      console.error('Reschedule error:', error);
      toast({
        variant: "destructive",
        title: "Rescheduling Failed",
        description: error.message || "Unable to reschedule appointment. Please try again or call us for assistance.",
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyReferralLink = async () => {
    if (!referralLinkData?.url) return;
    
    try {
      await navigator.clipboard.writeText(referralLinkData.url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your referral link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const shareViaFacebook = () => {
    if (!referralLinkData?.url) return;
    const url = encodeURIComponent(referralLinkData.url);
    const text = encodeURIComponent("Check out Economy Plumbing Services! They're the best plumbers in Austin. Use my referral link to get started:");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareViaX = () => {
    if (!referralLinkData?.url) return;
    const url = encodeURIComponent(referralLinkData.url);
    const text = encodeURIComponent("Check out Economy Plumbing Services! Best plumbers in Austin 💧");
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!referralLinkData?.url) return;
    const subject = encodeURIComponent("I recommend Economy Plumbing Services");
    const body = encodeURIComponent(`Hi!\n\nI wanted to share Economy Plumbing Services with you. They've been great for all my plumbing needs in the Austin area!\n\nCheck them out here: ${referralLinkData.url}\n\nBest regards`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSMS = () => {
    if (!referralLinkData?.url) return;
    const text = encodeURIComponent(`Check out Economy Plumbing Services - best plumbers in Austin! ${referralLinkData.url}`);
    window.location.href = `sms:?&body=${text}`;
  };

  const requestPDF = async (type: 'invoice' | 'estimate', number: string, id: number) => {
    try {
      const response = await fetch('/api/portal/request-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          number,
          id,
          customerId,
          customerName: customerData?.customer.name,
          customerEmail: customerData?.customer.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }

      toast({
        title: "PDF Requested",
        description: `We've received your request for ${type} #${number}. We'll email you the PDF shortly.`,
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to send PDF request. Please call us directly.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('scheduled') || statusLower.includes('pending')) {
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    if (statusLower.includes('completed') || statusLower.includes('paid')) {
      return <Badge data-testid={`badge-status-${status}`}><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    if (statusLower.includes('cancelled') || statusLower.includes('overdue')) {
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
    return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  return (
    <>
      <SEOHead
        title="Customer Portal - Economy Plumbing Services"
        description="Access your service history, appointments, and invoices. View your Economy Plumbing Services account information and upcoming appointments."
      />
      <Header />

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Customer Portal
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access your service history, appointments, and invoices
            </p>
          </div>

          {!customerId ? (
            verificationStep === 'lookup' ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Find Your Account</CardTitle>
                  <CardDescription>
                    Enter your email address to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="lookup-input">
                      Email Address
                    </Label>
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
                    {isSearching ? 'Searching...' : 'Access My Account'}
                  </Button>

                  {lookupError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-destructive">
                          <p className="font-medium mb-1">Account Not Found</p>
                          <p>{lookupError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : verificationStep === 'verify-code' ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Enter Verification Code</CardTitle>
                  <CardDescription>
                    {verificationMessage}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">
                      {lookupType === 'phone' ? '6-Digit Code' : 'Check your email for the access link'}
                    </Label>
                    {lookupType === 'phone' && (
                      <>
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                          maxLength={6}
                          data-testid="input-verification-code"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the 6-digit code sent to {lookupValue}
                        </p>
                      </>
                    )}
                    {lookupType === 'email' && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">Check your email</p>
                            <p className="text-sm text-muted-foreground">
                              We sent a secure access link to {lookupValue}. Click the link in the email to access your portal.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {lookupType === 'phone' && (
                    <Button
                      onClick={handleVerifyCode}
                      className="w-full"
                      disabled={verificationCode.length !== 6 || isVerifying}
                      data-testid="button-verify-code"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleBackToLookup}
                    className="w-full"
                    data-testid="button-back-to-lookup"
                  >
                    Try Another Method
                  </Button>

                  {lookupError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-destructive">
                          <p className="font-medium mb-1">Verification Failed</p>
                          <p>{lookupError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : verificationStep === 'select-account' ? (
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
                          {account.type === 'Commercial' ? (
                            <Users className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <Home className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{account.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {account.type}
                              </Badge>
                            </div>
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
            ) : null
          ) : (
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                      <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't load your account information. Please try again.
                      </p>
                      <Button onClick={() => setCustomerId(null)} data-testid="button-try-again">
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : customerData ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-primary" />
                        <div>
                          <CardTitle>{customerData.customer.name}</CardTitle>
                          <CardDescription>Customer Account</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={openScheduler}
                          data-testid="button-schedule-appointment"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Appointment
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          data-testid="button-call"
                        >
                          <a href={`tel:${phoneConfig.tel}`}>
                            <PhoneIcon className="w-4 h-4 mr-2" />
                            Call {phoneConfig.display}
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          data-testid="button-text"
                        >
                          <a href={`sms:${phoneConfig.tel}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Text Us
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          data-testid="button-contact-us"
                        >
                          <a href="/contact">
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Us
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            // Clear server-side session
                            await fetch('/api/portal/logout', { method: 'POST' });
                            setCustomerId(null);
                            setVerificationStep('lookup');
                          }}
                          data-testid="button-logout"
                        >
                          Switch Account
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone</p>
                          <p className="font-medium" data-testid="text-customer-phone">{customerData.customer.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <p className="font-medium" data-testid="text-customer-email">{customerData.customer.email || 'Not provided'}</p>
                        </div>
                        {customerData.customer.address && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Service Address</p>
                            <p className="font-medium" data-testid="text-customer-address">
                              {customerData.customer.address.street}, {customerData.customer.address.city}, {customerData.customer.address.state} {customerData.customer.address.zip}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Referral Program Promotion */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Gift className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle>Earn $25 Credit</CardTitle>
                            <CardDescription className="mt-1">
                              Refer friends and family to Economy Plumbing
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-primary">
                          Referral Rewards
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <Gift className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">You Get $25</p>
                            <p className="text-sm text-muted-foreground">
                              When your referral completes a service of $200+
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">They Get $25</p>
                            <p className="text-sm text-muted-foreground">
                              Your friend saves on their first service call
                            </p>
                          </div>
                        </div>
                      </div>

                      {referralLinkData && (
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-medium">Your Referral Stats</p>
                            <Share2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Link Clicks</p>
                              <p className="font-semibold text-lg" data-testid="text-referral-clicks">{referralLinkData.clicks}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Completed Referrals</p>
                              <p className="font-semibold text-lg text-primary" data-testid="text-referral-conversions">{referralLinkData.conversions}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground text-center">
                        Share your unique referral link with friends and family. When they complete a qualifying service, you both earn $25 credit!
                      </p>

                      <Button
                        asChild
                        className="w-full"
                        size="lg"
                        data-testid="button-start-referring"
                      >
                        <a href="/refer-a-friend">
                          <Share2 className="w-4 h-4 mr-2" />
                          Start Referring & Earning
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Savings Calculator - Show value to members and missed savings to non-members */}
                  {(() => {
                    // Calculate total from paid invoices
                    const paidInvoices = customerData.invoices.filter(inv => 
                      inv.status.toLowerCase().includes('paid') || inv.status.toLowerCase().includes('complete')
                    );
                    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
                    
                    // VIP members typically get 15% off
                    const memberSavingsRate = 0.15;
                    const estimatedSavings = totalPaid * memberSavingsRate;
                    
                    const isVIPMember = customerData.memberships && customerData.memberships.length > 0;
                    
                    // Only show if there's meaningful data
                    if (totalPaid < 100) return null;
                    
                    return (
                      <Card className={`border-2 ${isVIPMember ? 'border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background' : 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background'}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isVIPMember ? 'bg-primary/20' : 'bg-amber-500/20'}`}>
                                <TrendingUp className={`w-6 h-6 ${isVIPMember ? 'text-primary' : 'text-amber-600 dark:text-amber-500'}`} />
                              </div>
                              <div>
                                <CardTitle className="text-2xl">
                                  {isVIPMember ? (
                                    <span className="text-primary">You've Saved {formatCurrency(estimatedSavings)}</span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-500">Save {formatCurrency(estimatedSavings)}</span>
                                  )}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {isVIPMember ? 'with your VIP membership' : 'by becoming a VIP member'}
                                </CardDescription>
                              </div>
                            </div>
                            {!isVIPMember && (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/50 dark:text-amber-500">
                                Opportunity
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Services</p>
                              <p className="text-2xl font-bold" data-testid="text-total-paid">{formatCurrency(totalPaid)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                          
                          {isVIPMember ? (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                As a VIP member, you've enjoyed <strong className="text-primary">member-only discounts</strong> on every service call, plus priority scheduling, no trip charges, and waived diagnostic fees.
                              </p>
                              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                <p className="text-sm font-medium">
                                  Your membership is saving you money on every visit!
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Based on your service history, you could save approximately <strong className="text-amber-600 dark:text-amber-500">{formatCurrency(estimatedSavings)}</strong> per year as a VIP member, plus enjoy priority scheduling, no trip charges, and waived diagnostic fees.
                              </p>
                              <p className="text-xs text-muted-foreground italic">
                                *Estimated savings based on typical 15% member discount applied to your historical spending
                              </p>
                              <Button
                                asChild
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                                size="lg"
                                data-testid="button-join-vip-savings"
                              >
                                <a href="/membership-benefits">
                                  <Crown className="w-4 h-4 mr-2" />
                                  Start Saving with VIP Membership
                                </a>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* VIP Membership Status - Shows real data from ServiceTitan */}
                  {customerData.memberships && customerData.memberships.length > 0 ? (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-primary" />
                            <div>
                              <CardTitle>VIP Member</CardTitle>
                              <CardDescription className="mt-1">
                                {customerData.memberships[0].membershipType}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="default" className="text-xs bg-primary">
                            {customerData.memberships[0].status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3">
                          {customerData.memberships[0].startDate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Member Since</span>
                              <span className="font-medium">
                                {new Date(customerData.memberships[0].startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                          {customerData.memberships[0].expirationDate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Expires</span>
                              <span className="font-medium">
                                {new Date(customerData.memberships[0].expirationDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                          {customerData.memberships[0].renewalDate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Next Renewal</span>
                              <span className="font-medium">
                                {new Date(customerData.memberships[0].renewalDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Member Benefits */}
                        <div className="pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Your Benefits</p>
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Savings on EVERY service call</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Priority same-day service</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>No trip charges</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Annual plumbing inspection included</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>After-hours service at regular rates</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Waived diagnostic fees</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-primary" />
                            <div>
                              <CardTitle>VIP Membership</CardTitle>
                              <CardDescription className="mt-1">
                                Not a VIP member yet
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Available
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Join our VIP Membership program and save on every service call, plus enjoy priority same-day service, no trip charges, and more!
                        </p>

                        {/* Member Benefits Preview */}
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Savings on EVERY service call</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Priority same-day service</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">No trip charges</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Annual plumbing inspection</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">After-hours service at regular rates</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Waived diagnostic fees</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <Button
                            asChild
                            className="w-full"
                            data-testid="button-vip-membership"
                          >
                            <a href="/vip-membership">
                              <Crown className="w-4 h-4 mr-2" />
                              Learn About VIP Membership
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Service Address */}
                  {customerData.customer.address && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-primary" />
                          <CardTitle>Service Address</CardTitle>
                        </div>
                        <CardDescription>
                          Primary location for service calls
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                          <Home className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium" data-testid="text-service-address">
                              {customerData.customer.address.street}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customerData.customer.address.city}, {customerData.customer.address.state} {customerData.customer.address.zip}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Need to update your service address? Call us at (512) 396-7811
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Customer Service Stats */}
                  {customerStats && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-primary" />
                          <div>
                            <CardTitle>Your Service History</CardTitle>
                            <CardDescription>
                              Track your loyalty and savings
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Service Count */}
                          <div className="p-4 bg-background rounded-lg border text-center">
                            <div className="text-4xl font-bold text-primary mb-1" data-testid="text-service-count">
                              {customerStats.serviceCount}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Total Services
                            </p>
                          </div>

                          {/* Top Percentile */}
                          <div className="p-4 bg-background rounded-lg border text-center">
                            <div className="text-4xl font-bold text-primary mb-1" data-testid="text-top-percentile">
                              Top {customerStats.topPercentile}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Customer Ranking
                            </p>
                          </div>
                        </div>

                        {/* Ranking Message */}
                        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                          <p className="text-sm font-medium">
                            {customerStats.topPercentile <= 10 
                              ? "You're one of our most valued customers! Thank you for your loyalty." 
                              : customerStats.topPercentile <= 25
                              ? "You're a highly valued customer! Keep using our services for more savings."
                              : customerStats.topPercentile <= 50
                              ? "Thank you for choosing Economy Plumbing Services! Continue scheduling services to climb the rankings."
                              : "Use our services more to climb the rankings and unlock VIP benefits!"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upcoming Appointments */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        <CardTitle>Upcoming Appointments</CardTitle>
                      </div>
                      <CardDescription>
                        Your scheduled service appointments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {upcomingAppointments.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground" data-testid="text-no-appointments">
                          No upcoming appointments
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {upcomingAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex items-start gap-4 p-4 border rounded-lg"
                              data-testid={`appointment-${appointment.id}`}
                            >
                              <Calendar className="w-5 h-5 text-primary mt-1" />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold">{appointment.jobType}</h4>
                                    {appointment.summary && (
                                      <p className="text-sm text-muted-foreground">{appointment.summary}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(appointment.status)}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenRescheduleDialog(appointment)}
                                      data-testid={`button-reschedule-${appointment.id}`}
                                    >
                                      <CalendarClock className="w-4 h-4 mr-1" />
                                      Reschedule
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p>
                                    <strong>Date:</strong> {formatDate(appointment.start)}
                                  </p>
                                  {appointment.arrivalWindowStart && appointment.arrivalWindowEnd && (
                                    <p>
                                      <strong>Arrival Window:</strong> {formatTime(appointment.arrivalWindowStart)} - {formatTime(appointment.arrivalWindowEnd)}
                                    </p>
                                  )}
                                  {appointment.jobNumber && (
                                    <p className="text-muted-foreground">
                                      Job #{appointment.jobNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Service History (Completed Appointments) */}
                  {completedAppointments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Clock className="w-6 h-6 text-primary" />
                          <CardTitle>Service History</CardTitle>
                        </div>
                        <CardDescription>
                          Your completed service appointments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {completedAppointments.slice(0, 5).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30"
                              data-testid={`appointment-completed-${appointment.id}`}
                            >
                              <Clock className="w-5 h-5 text-muted-foreground mt-1" />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold">{appointment.jobType}</h4>
                                    {appointment.summary && (
                                      <p className="text-sm text-muted-foreground">{appointment.summary}</p>
                                    )}
                                  </div>
                                  {getStatusBadge(appointment.status)}
                                </div>
                                <div className="text-sm space-y-1">
                                  <p>
                                    <strong>Date:</strong> {formatDate(appointment.start)}
                                  </p>
                                  {appointment.jobNumber && (
                                    <p className="text-muted-foreground">
                                      Job #{appointment.jobNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {completedAppointments.length > 5 && (
                            <p className="text-sm text-center text-muted-foreground">
                              Showing 5 most recent service visits ({completedAppointments.length} total)
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        <CardTitle>Invoices</CardTitle>
                      </div>
                      <CardDescription>
                        Your service invoices and payment history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customerData.invoices.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground" data-testid="text-no-invoices">
                          No invoices found
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {customerData.invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex items-start gap-4 p-4 border rounded-lg"
                              data-testid={`invoice-${invoice.id}`}
                            >
                              <DollarSign className="w-5 h-5 text-primary mt-1" />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold">Invoice #{invoice.invoiceNumber}</h4>
                                    {invoice.summary && (
                                      <p className="text-sm text-muted-foreground">{invoice.summary}</p>
                                    )}
                                  </div>
                                  {getStatusBadge(invoice.status)}
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span><strong>Total:</strong></span>
                                    <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                                  </div>
                                  {invoice.balance > 0 && (
                                    <div className="flex justify-between text-destructive">
                                      <span><strong>Balance Due:</strong></span>
                                      <span className="font-semibold">{formatCurrency(invoice.balance)}</span>
                                    </div>
                                  )}
                                  <p className="text-muted-foreground">
                                    Created: {formatDate(invoice.createdOn)}
                                  </p>
                                  {invoice.dueDate && (
                                    <p className="text-muted-foreground">
                                      Due: {formatDate(invoice.dueDate)}
                                    </p>
                                  )}
                                  {invoice.jobNumber && (
                                    <p className="text-muted-foreground">
                                      Job #{invoice.jobNumber}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requestPDF('invoice', invoice.invoiceNumber, invoice.id)}
                                    data-testid={`button-request-invoice-pdf-${invoice.id}`}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Request PDF Copy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Open Estimates */}
                  {(() => {
                    // Filter to show only open/pending estimates (exclude approved, declined, expired, closed)
                    const openEstimates = customerData.estimates?.filter(estimate => {
                      const status = estimate.status.toLowerCase();
                      return !status.includes('approved') && 
                             !status.includes('declined') && 
                             !status.includes('expired') && 
                             !status.includes('closed') &&
                             !status.includes('sold');
                    }) || [];

                    if (openEstimates.length === 0) return null;

                    // Helper function to calculate days until expiration
                    const getDaysUntilExpiration = (expiresOn: string) => {
                      const now = new Date();
                      const expirationDate = new Date(expiresOn);
                      const diffTime = expirationDate.getTime() - now.getTime();
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    };

                    // Check if any estimates are expiring soon (within 7 days)
                    const hasExpiringSoon = openEstimates.some(est => 
                      est.expiresOn && getDaysUntilExpiration(est.expiresOn) <= 7 && getDaysUntilExpiration(est.expiresOn) > 0
                    );

                    return (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            <CardTitle>Open Estimates</CardTitle>
                          </div>
                          <CardDescription>
                            Pending quotes and proposals for your review
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Expiration Policy Notice */}
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-muted-foreground">
                                <strong>Expiration Policy:</strong> All estimates expire after 30 days. Material costs and availability may change after expiration.
                              </p>
                            </div>
                          </div>

                          {/* Expiring Soon Alert */}
                          {hasExpiringSoon && (
                            <div className="mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-amber-800 dark:text-amber-400 mb-1">Action Required</p>
                                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                                    You have estimates expiring soon. Schedule your service now to lock in current pricing!
                                  </p>
                                  <Button
                                    onClick={openScheduler}
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                                    data-testid="button-schedule-expiring-estimate"
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule Service Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            {openEstimates.map((estimate) => {
                              const daysUntilExpiration = estimate.expiresOn ? getDaysUntilExpiration(estimate.expiresOn) : null;
                              const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;
                              const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0;

                              return (
                            <div
                              key={estimate.id}
                              className={`flex items-start gap-4 p-4 border rounded-lg ${
                                isExpiringSoon 
                                  ? 'bg-amber-500/5 border-amber-500/30' 
                                  : 'bg-primary/5'
                              }`}
                              data-testid={`estimate-${estimate.id}`}
                            >
                              <FileText className={`w-5 h-5 mt-1 ${isExpiringSoon ? 'text-amber-600 dark:text-amber-500' : 'text-primary'}`} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold">Estimate #{estimate.estimateNumber}</h4>
                                    {estimate.summary && (
                                      <p className="text-sm text-muted-foreground">{estimate.summary}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isExpiringSoon && (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'} left
                                      </Badge>
                                    )}
                                    {getStatusBadge(estimate.status)}
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span><strong>Total:</strong></span>
                                    <span className="font-semibold text-primary">{formatCurrency(estimate.total)}</span>
                                  </div>
                                  <p className="text-muted-foreground">
                                    Created: {formatDate(estimate.createdOn)}
                                  </p>
                                  {estimate.expiresOn && (
                                    <p className={`${isExpiringSoon ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                                      Expires: {formatDate(estimate.expiresOn)}
                                      {isExpiringSoon && (
                                        <span className="ml-2 text-xs">⚠️ Expiring Soon!</span>
                                      )}
                                    </p>
                                  )}
                                  {estimate.jobNumber && (
                                    <p className="text-muted-foreground">
                                      Job #{estimate.jobNumber}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  {isExpiringSoon && (
                                    <div className="flex gap-2 mb-2">
                                      <Button
                                        onClick={openScheduler}
                                        size="sm"
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                                        data-testid={`button-schedule-estimate-${estimate.id}`}
                                      >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Schedule Now
                                      </Button>
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        data-testid={`button-call-estimate-${estimate.id}`}
                                      >
                                        <a href={`tel:${phoneConfig.tel}`}>
                                          <PhoneIcon className="w-4 h-4 mr-2" />
                                          Call Us
                                        </a>
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requestPDF('estimate', estimate.estimateNumber, estimate.id)}
                                    data-testid={`button-request-estimate-pdf-${estimate.id}`}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Request PDF Copy
                                  </Button>
                                  <p className="text-xs text-muted-foreground">
                                    Questions about this estimate? Call us at <a href={`tel:${phoneConfig.tel}`} className="text-primary hover:underline">{phoneConfig.display}</a>
                                  </p>
                                </div>
                              </div>
                            </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Leave a Review (show if they have completed appointments) */}
                  {completedAppointments.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-primary" />
                          <CardTitle>Love Our Service?</CardTitle>
                        </div>
                        <CardDescription>
                          Share your experience and help others find great plumbing service
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">Your Review Matters</p>
                            <p className="text-sm text-muted-foreground">
                              Help your neighbors find reliable plumbing service. Your honest feedback helps us improve and helps others make informed decisions.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            asChild
                            className="flex-1"
                            data-testid="button-leave-google-review"
                          >
                            <a 
                              href="https://g.page/r/CV-sfCZq8cAzEBM/review"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Leave Google Review
                            </a>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1"
                            data-testid="button-leave-facebook-review"
                          >
                            <a 
                              href="https://www.facebook.com/economyplumbingservices/reviews"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Review on Facebook
                            </a>
                          </Button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground">
                          Takes less than 2 minutes - makes a huge difference!
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Referral Link Sharing */}
                  {referralLinkData && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Share2 className="w-6 h-6 text-primary" />
                          <CardTitle>Share Your Referral Link</CardTitle>
                        </div>
                        <CardDescription>
                          Share your unique link with friends and family to earn rewards
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Referral Link with Copy Button */}
                        <div className="space-y-2">
                          <Label htmlFor="referral-link">Your Unique Referral Link</Label>
                          <div className="flex gap-2">
                            <Input
                              id="referral-link"
                              value={referralLinkData.url}
                              readOnly
                              className="font-mono text-sm"
                              data-testid="input-referral-link"
                            />
                            <Button
                              onClick={copyReferralLink}
                              variant={copied ? "default" : "outline"}
                              size="icon"
                              className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                              data-testid="button-copy-link"
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-background rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Total Clicks</p>
                            </div>
                            <p className="text-2xl font-bold" data-testid="text-clicks">{referralLinkData.clicks}</p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Conversions</p>
                            </div>
                            <p className="text-2xl font-bold text-primary" data-testid="text-conversions">{referralLinkData.conversions}</p>
                          </div>
                        </div>

                        {/* Send Referral Button */}
                        <div className="pt-2">
                          <Button
                            onClick={() => setShowReferralModal(true)}
                            className="w-full"
                            size="lg"
                            data-testid="button-send-referral"
                          >
                            <Gift className="w-5 h-5 mr-2" />
                            Send a Referral Now
                          </Button>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Enter your friend's info and we'll send them your referral link via SMS and email
                          </p>
                        </div>

                        {/* Social Sharing Buttons */}
                        <div className="space-y-2">
                          <Label>Or Share on Social Media</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Button
                              onClick={shareViaFacebook}
                              variant="outline"
                              className="gap-2"
                              data-testid="button-share-facebook"
                            >
                              <SiFacebook className="w-4 h-4" />
                              Facebook
                            </Button>
                            <Button
                              onClick={shareViaX}
                              variant="outline"
                              className="gap-2"
                              data-testid="button-share-x"
                            >
                              <SiX className="w-4 h-4" />
                              X
                            </Button>
                            <Button
                              onClick={shareViaEmail}
                              variant="outline"
                              className="gap-2"
                              data-testid="button-share-email"
                            >
                              <Mail className="w-4 h-4" />
                              Email
                            </Button>
                            <Button
                              onClick={shareViaSMS}
                              variant="outline"
                              className="gap-2"
                              data-testid="button-share-sms"
                            >
                              <MessageSquare className="w-4 h-4" />
                              SMS
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Referral Tracking - Your Referrals */}
                  {referralsData && referralsData.referrals.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Users className="w-6 h-6 text-primary" />
                          <CardTitle>Your Referrals</CardTitle>
                        </div>
                        <CardDescription>
                          Track the status of your referrals and earned credits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {referralsData.referrals.map((referral: any) => {
                          const isReferrer = referral.referrerCustomerId === parseInt(customerId!);
                          const statusColors: Record<string, string> = {
                            pending: 'bg-gray-100 text-gray-800',
                            contacted: 'bg-blue-100 text-blue-800',
                            job_completed: 'bg-green-100 text-green-800',
                            credited: 'bg-primary/10 text-primary'
                          };
                          
                          return (
                            <div key={referral.id} className="p-4 bg-background rounded-lg border">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-medium">
                                      {isReferrer ? `Referred: ${referral.refereeName}` : `Referred by: ${referral.referrerName}`}
                                    </p>
                                    <Badge className={statusColors[referral.status] || 'bg-gray-100 text-gray-800'} data-testid={`badge-referral-status-${referral.id}`}>
                                      {referral.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>Phone: {isReferrer ? referral.refereePhone : referral.referrerPhone}</p>
                                    <p>Submitted: {new Date(referral.submittedAt).toLocaleDateString()}</p>
                                    
                                    {referral.status === 'job_completed' && referral.firstJobDate && (
                                      <p className="text-green-600 font-medium">
                                        Job Completed: {new Date(referral.firstJobDate).toLocaleDateString()}
                                      </p>
                                    )}
                                    
                                    {referral.status === 'credited' && isReferrer && (
                                      <>
                                        <p className="text-primary font-medium">
                                          <DollarSign className="w-4 h-4 inline mr-1" />
                                          Credit Earned: ${(referral.creditAmount / 100).toFixed(2)}
                                        </p>
                                        {referral.expiresAt && (() => {
                                          const expiryDate = new Date(referral.expiresAt);
                                          const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                          const isExpired = daysUntilExpiry <= 0;
                                          
                                          return (
                                            <p className={`text-sm ${isExpired ? 'text-destructive font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                                              <Clock className="w-3 h-3 inline mr-1" />
                                              {isExpired ? 'Expired' : 'Expires'}: {expiryDate.toLocaleDateString()}
                                              {isExpiringSoon && !isExpired && ` (${daysUntilExpiry} days left)`}
                                            </p>
                                          );
                                        })()}
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {referral.status === 'credited' && isReferrer && (
                                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowReferralModal(true)}
                            data-testid="button-refer-more"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Refer Another Friend
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Referral Program */}
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Gift className="w-6 h-6 text-primary" />
                        <CardTitle>Earn $25 for Every Referral!</CardTitle>
                      </div>
                      <CardDescription>
                        Our Referral Rewards Program makes it easy to earn credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">$25 Service Credit Per Referral</p>
                            <p className="text-sm text-muted-foreground">
                              When your friend completes a service call of $200 or more, you automatically earn a $25 service credit! Credits expire 6 months (180 days) after being issued and have no cash value.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">Climb the Leaderboard</p>
                            <p className="text-sm text-muted-foreground">
                              Compete with other customers for the top spot! Our referral leaderboard tracks successful referrals and showcases our top advocates.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                          <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">They Win Too</p>
                            <p className="text-sm text-muted-foreground">
                              Your friends get priority scheduling and join the Economy Plumbing family with the same quality service you love!
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="flex-1"
                          onClick={() => setShowReferralModal(true)}
                          data-testid="button-refer-program"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Your Link Now
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.location.href = '/refer-a-friend'}
                          data-testid="button-learn-rewards"
                        >
                          View Leaderboard
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Referral Modal */}
      {customerData && referralLinkData && (
        <ReferralModal
          open={showReferralModal}
          onOpenChange={setShowReferralModal}
          customerName={customerData.customer.name}
          customerPhone={customerData.customer.phoneNumber}
          customerId={customerId!}
          referralCode={referralLinkData.code}
        />
      )}

      {/* Reschedule Appointment Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent data-testid="dialog-reschedule">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time window for your appointment. We'll update your schedule right away.
            </DialogDescription>
          </DialogHeader>

          {appointmentToReschedule && (
            <div className="space-y-4 py-4">
              {/* Current appointment info */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="text-sm font-medium mb-2">Current Appointment:</p>
                <p className="text-sm text-muted-foreground">
                  {appointmentToReschedule.jobType}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(appointmentToReschedule.start)} at {formatTime(appointmentToReschedule.start)}
                </p>
              </div>

              {/* New date and time window inputs */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-date">New Date</Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newAppointmentDate}
                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-new-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-window">Time Window</Label>
                  <Select
                    value={newAppointmentWindow}
                    onValueChange={setNewAppointmentWindow}
                  >
                    <SelectTrigger id="new-window" data-testid="select-time-window">
                      <SelectValue placeholder="Select a time window" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeWindows.map((window) => (
                        <SelectItem 
                          key={`${window.start}-${window.end}`} 
                          value={`${window.start}-${window.end}`}
                          data-testid={`option-${window.start}-${window.end}`}
                        >
                          {window.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Note: This will update your appointment in our system. You can also call us at {phoneConfig.display} for assistance.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
              disabled={isRescheduling}
              data-testid="button-cancel-reschedule"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleAppointment}
              disabled={isRescheduling || !newAppointmentDate || !newAppointmentWindow}
              data-testid="button-confirm-reschedule"
            >
              {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
