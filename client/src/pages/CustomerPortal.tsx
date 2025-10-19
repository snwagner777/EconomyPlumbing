import { useState } from "react";
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
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
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
  TrendingUp
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

interface CustomerData {
  customer: ServiceTitanCustomer;
  appointments: ServiceTitanAppointment[];
  invoices: ServiceTitanInvoice[];
  memberships: ServiceTitanMembership[];
}

export default function CustomerPortal() {
  const [lookupValue, setLookupValue] = useState("");
  const [lookupType, setLookupType] = useState<"phone" | "email" | "account">("phone");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    
    setLookupError(null);
    setIsSearching(true);

    try {
      // For account number, use direct customer ID lookup
      if (lookupType === 'account') {
        setCustomerId(lookupValue);
      } else {
        // For phone/email, use hybrid search (local cache + live fallback)
        const params = new URLSearchParams({
          [lookupType]: lookupValue,
        });
        const response = await fetch(`/api/servicetitan/customer/search?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Customer not found');
        }

        const result = await response.json();
        setCustomerId(result.id.toString());
      }
    } catch (err) {
      console.error('Customer lookup failed:', err);
      const errorMessages = {
        phone: 'We couldn\'t find an account with that phone number. Please try searching by email or account number instead.',
        email: 'We couldn\'t find an account with that email address. Please try searching by phone or account number instead.',
        account: 'We couldn\'t find an account with that number. Please check your invoice or receipt for your customer ID, or try searching by phone or email instead.'
      };
      setLookupError(errorMessages[lookupType]);
    } finally {
      setIsSearching(false);
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
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Find Your Account</CardTitle>
                <CardDescription>
                  Enter your phone number, email, or account number to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={lookupType === "phone" ? "default" : "outline"}
                    onClick={() => setLookupType("phone")}
                    className="flex-1"
                    data-testid="button-lookup-phone"
                  >
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Phone
                  </Button>
                  <Button
                    variant={lookupType === "email" ? "default" : "outline"}
                    onClick={() => setLookupType("email")}
                    className="flex-1"
                    data-testid="button-lookup-email"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant={lookupType === "account" ? "default" : "outline"}
                    onClick={() => setLookupType("account")}
                    className="flex-1"
                    data-testid="button-lookup-account"
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    Account #
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lookup-input">
                    {lookupType === "phone" ? "Phone Number" : lookupType === "email" ? "Email Address" : "Account Number"}
                  </Label>
                  <Input
                    id="lookup-input"
                    type={lookupType === "phone" ? "tel" : lookupType === "email" ? "email" : "text"}
                    placeholder={
                      lookupType === "phone" 
                        ? "(512) 555-1234" 
                        : lookupType === "email" 
                        ? "your@email.com" 
                        : "1234567"
                    }
                    value={lookupValue}
                    onChange={(e) => setLookupValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    data-testid="input-lookup"
                  />
                  {lookupType === "account" && (
                    <p className="text-xs text-muted-foreground">
                      Find your account number on any invoice or receipt
                    </p>
                  )}
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
                          onClick={() => setCustomerId(null)}
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
                              <Star className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Priority Scheduling</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>No Overtime Charges</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                              <span>Annual Maintenance Included</span>
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
                          Join our VIP Membership program and enjoy exclusive benefits including priority scheduling, no overtime charges, and annual maintenance!
                        </p>

                        {/* Member Benefits Preview */}
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Priority Scheduling</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">No Overtime Charges</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">Annual Maintenance</span>
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
                                  {getStatusBadge(appointment.status)}
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
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

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
                              variant="outline"
                              size="icon"
                              data-testid="button-copy-link"
                            >
                              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
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

                        {/* Social Sharing Buttons */}
                        <div className="space-y-2">
                          <Label>Share on Social Media</Label>
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
                                      <p className="text-primary font-medium">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Credit Earned: ${(referral.creditAmount / 100).toFixed(2)}
                                      </p>
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
                            asChild
                            variant="outline"
                            className="w-full"
                            data-testid="button-refer-more"
                          >
                            <a href="/refer-a-friend">
                              <Gift className="w-4 h-4 mr-2" />
                              Refer Another Friend
                            </a>
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
                        <CardTitle>Refer a Friend, Earn Rewards</CardTitle>
                      </div>
                      <CardDescription>
                        Love our service? Share it with friends and family
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                        <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">You Both Save</p>
                          <p className="text-sm text-muted-foreground">
                            Earn service credits for every friend you refer. They get a new customer discount and priority scheduling!
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          asChild
                          className="flex-1"
                          data-testid="button-refer-program"
                        >
                          <a href="/refer-a-friend">
                            <Gift className="w-4 h-4 mr-2" />
                            Refer Friends Now
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1"
                          data-testid="button-learn-rewards"
                        >
                          <a href="/refer-a-friend">
                            Learn About Rewards
                          </a>
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
    </>
  );
}
