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
import { 
  User,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone as PhoneIcon,
  Mail,
  Hash
} from "lucide-react";

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

interface CustomerData {
  customer: ServiceTitanCustomer;
  appointments: ServiceTitanAppointment[];
  invoices: ServiceTitanInvoice[];
}

export default function CustomerPortal() {
  const [lookupValue, setLookupValue] = useState("");
  const [lookupType, setLookupType] = useState<"phone" | "email" | "account">("phone");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: customerData, isLoading, error } = useQuery<CustomerData>({
    queryKey: ['/api/servicetitan/customer', customerId],
    enabled: !!customerId,
  });

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    
    setLookupError(null);
    setIsSearching(true);

    try {
      // For account number, use direct customer ID lookup
      if (lookupType === 'account') {
        const response = await fetch(`/api/servicetitan/customer/${lookupValue}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Customer not found');
        }

        const customer = await response.json();
        setCustomerId(customer.customer.id);
      } else {
        // For phone/email, use search endpoint
        const params = new URLSearchParams({
          [lookupType]: lookupValue,
        });
        const response = await fetch(`/api/servicetitan/customer/search?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Customer not found');
        }

        const customer = await response.json();
        setCustomerId(customer.id);
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
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-primary" />
                        <div>
                          <CardTitle>{customerData.customer.name}</CardTitle>
                          <CardDescription>Customer Account</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCustomerId(null)}
                        data-testid="button-logout"
                      >
                        Switch Account
                      </Button>
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
                      {customerData.appointments.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground" data-testid="text-no-appointments">
                          No upcoming appointments
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {customerData.appointments.map((appointment) => (
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
