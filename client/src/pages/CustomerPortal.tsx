import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
  Phone,
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
  CalendarClock,
  Edit2,
  Building2,
  Briefcase
} from "lucide-react";
import { SiFacebook, SiX } from "react-icons/si";

interface ServiceTitanContact {
  id: number;
  type: string;
  value: string;
  memo?: string;
  phoneSettings?: {
    phoneNumber: string;
    doNotText: boolean;
  };
}

interface ServiceTitanCustomer {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  contacts?: ServiceTitanContact[];
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
  businessUnitName?: string;
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
  isExpired?: boolean;
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
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Multi-account support
  const [availableAccounts, setAvailableAccounts] = useState<CustomerAccount[]>([]);
  const [availableCustomerIds, setAvailableCustomerIds] = useState<number[]>([]);
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
  
  // Edit contact info state
  const [editContactsOpen, setEditContactsOpen] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
  
  // Delete contact state
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: number; type: string; value: string } | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  
  // Edit address state
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editZip, setEditZip] = useState("");
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [locationId, setLocationId] = useState<number | null>(null);
  
  // Estimate detail modal state
  const [estimateDetailOpen, setEstimateDetailOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ServiceTitanEstimate | null>(null);
  
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

  // Fetch ALL locations for this customer (multi-location support)
  const { data: locationsData } = useQuery<{
    locations: Array<{
      id: number;
      name?: string;
      address: {
        street: string;
        city: string;
        state: string;
        zip: string;
      };
    }>;
  }>({
    queryKey: ['/api/portal/customer-locations', customerId],
    enabled: !!customerId,
  });

  // Fetch email communication history
  const { data: emailHistoryData } = useQuery<{
    emails: Array<{
      id: string;
      subject: string | null;
      campaignName: string | null;
      sentAt: string;
      openedAt: string | null;
      clickedAt: string | null;
      status: string | null;
    }>;
  }>({
    queryKey: ['/api/portal/customer', customerId, 'emails'],
    enabled: !!customerId,
  });

  const timeWindows = arrivalWindowsData?.windows || [];
  const customerLocations = locationsData?.locations || [];

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
          setAvailableCustomerIds(data.availableCustomerIds || [data.customerId]);
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid or expired magic link');
      }

      const result = await response.json();
      
      // Check if multiple accounts exist
      if (result.customers && result.customers.length > 1) {
        setAvailableAccounts(result.customers);
        setAvailableCustomerIds(result.customers.map((c: any) => c.id));
        setVerificationStep('select-account');
        setLookupSuccess("Please select which account you'd like to access");
      } else if (result.customers && result.customers.length === 1) {
        // Single account - auto-select it
        const customerIdStr = result.customers[0].id.toString();
        setCustomerId(customerIdStr);
        setAvailableCustomerIds([result.customers[0].id]);
        setVerificationStep('authenticated');
        setLookupSuccess("Welcome to your customer portal!");
      } else if (result.customerId) {
        // Backward compatibility for old response format
        const customerIdStr = result.customerId.toString();
        setCustomerId(customerIdStr);
        setAvailableCustomerIds([result.customerId]);
        setVerificationStep('authenticated');
        setLookupSuccess("Welcome to your customer portal!");
      } else {
        throw new Error('No customer data returned');
      }
      
      setLookupError(null);
      
      // Session is now stored server-side via httpOnly cookie
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('Magic link verification failed:', error);
      
      // Parse the error response
      const errorMessage = error.message || "The magic link is invalid or has expired. Please try again.";
      setLookupError(errorMessage);
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
      setLookupSuccess(result.message);
    } catch (err: any) {
      console.error('Customer lookup failed:', err);
      setLookupError(err.message || 'We couldn\'t find an account with that information. Please verify and try again.');
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
      
      // Check if multiple accounts exist
      if (result.customers && result.customers.length > 1) {
        setAvailableAccounts(result.customers);
        setAvailableCustomerIds(result.customers.map((c: any) => c.id));
        setVerificationStep('select-account');
        setLookupSuccess("Please select which account you'd like to access");
      } else if (result.customers && result.customers.length === 1) {
        // Single account - auto-select it
        const customerIdStr = result.customers[0].id.toString();
        setCustomerId(customerIdStr);
        setAvailableCustomerIds([result.customers[0].id]);
        setVerificationStep('authenticated');
        setLookupSuccess("Welcome to your customer portal!");
        
        // Session is now stored server-side via httpOnly cookie
      } else if (result.customerId) {
        // Backward compatibility for old response format
        const customerIdStr = result.customerId.toString();
        setCustomerId(customerIdStr);
        setAvailableCustomerIds([result.customerId]);
        setVerificationStep('authenticated');
        setLookupSuccess("Welcome to your customer portal!");
        
        // Session is now stored server-side via httpOnly cookie
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

  const handleSelectAccount = async (accountId: number) => {
    try {
      // If we're in the select-account step (initial auth), just set the customer ID
      if (verificationStep === 'select-account') {
        setCustomerId(accountId.toString());
        setVerificationStep('authenticated');
        setShowAccountSelection(false);
      } else {
        // We're switching accounts - call the API
        const response = await fetch('/api/portal/switch-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: accountId }),
        });

        if (!response.ok) {
          throw new Error('Failed to switch account');
        }

        setCustomerId(accountId.toString());
        setShowAccountSelection(false);
        
        // Invalidate and refetch customer data
        queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/customer'] });
      }
    } catch (error: any) {
      console.error('Account switch error:', error);
      setLookupError('Failed to switch account. Please try again.');
    }
  };

  const handleSwitchAccount = async () => {
    // If we have multiple accounts stored in availableCustomerIds, fetch their details
    if (availableCustomerIds.length > 1) {
      try {
        // Fetch account details for all available customer IDs
        const accountPromises = availableCustomerIds.map(async (id) => {
          const response = await fetch(`/api/servicetitan/customer/${id}`);
          const data = await response.json();
          return {
            id: data.customer.id,
            name: data.customer.name,
            type: 'Residential', // We don't have type in the customer data yet
            address: data.customer.address ? 
              [data.customer.address.street, data.customer.address.city, data.customer.address.state].filter(Boolean).join(', ') : 
              undefined
          };
        });

        const accounts = await Promise.all(accountPromises);
        setAvailableAccounts(accounts);
        setShowAccountSelection(true);
      } catch (error) {
        console.error('Failed to load account details:', error);
        setLookupError('Failed to load account details');
      }
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

      // Refresh customer data
      window.location.reload();
      
      setRescheduleDialogOpen(false);
    } catch (error: any) {
      console.error('Reschedule error:', error);
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
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

  const handleRequestPDF = async (
    type: 'invoice' | 'estimate', 
    number: string, 
    id: number, 
    customerInfo: { customerId: number; customerName: string; customerEmail: string }
  ) => {
    try {
      const response = await fetch('/api/portal/request-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          number,
          id,
          customerId: customerInfo.customerId,
          customerName: customerInfo.customerName,
          customerEmail: customerInfo.customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      console.error('PDF request failed:', error);
    }
  };

  // Fetch customer location when needed
  const fetchCustomerLocation = async () => {
    if (!customerId) return;
    
    try {
      const response = await fetch(`/api/portal/customer-location/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch location');
      
      const data = await response.json();
      if (data.location) {
        setLocationId(data.location.id);
        setEditStreet(data.location.address?.street || '');
        setEditCity(data.location.address?.city || '');
        setEditState(data.location.address?.state || '');
        setEditZip(data.location.address?.zip || '');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleEditContacts = () => {
    if (!customerData) return;
    setEditEmail(customerData.customer.email || '');
    setEditPhone(customerData.customer.phoneNumber || '');
    setEditContactsOpen(true);
  };

  const handleUpdateContacts = async () => {
    if (!customerId) return;
    
    setIsUpdatingContacts(true);
    try {
      const response = await fetch('/api/portal/update-contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          email: editEmail,
          phone: editPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contacts');
      }

      setEditContactsOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Update contacts error:', error);
    } finally {
      setIsUpdatingContacts(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!customerId || !contactToDelete) return;
    
    setIsDeletingContact(true);
    try {
      const response = await fetch('/api/portal/delete-contact', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          contactId: contactToDelete.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete contact' }));
        throw new Error(errorData.error || 'Failed to delete contact');
      }

      // Show success toast
      toast({
        title: "Contact deleted",
        description: `${contactToDelete.type} successfully removed from your account.`,
      });

      // Close dialog and reset state
      setDeleteContactDialogOpen(false);
      setContactToDelete(null);

      // Invalidate customer data query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/customer', customerId] });
    } catch (error: any) {
      console.error('Delete contact error:', error);
      
      // Show error toast
      toast({
        title: "Error deleting contact",
        description: error.message || "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleEditAddress = async () => {
    if (!customerData) return;
    
    // Fetch location first
    await fetchCustomerLocation();
    
    // Pre-fill with current address if available
    if (customerData.customer.address) {
      setEditStreet(customerData.customer.address.street || '');
      setEditCity(customerData.customer.address.city || '');
      setEditState(customerData.customer.address.state || '');
      setEditZip(customerData.customer.address.zip || '');
    }
    
    setEditAddressOpen(true);
  };

  const handleUpdateAddress = async () => {
    if (!customerId || !locationId) {
      return;
    }
    
    if (!editStreet || !editCity || !editState || !editZip) {
      return;
    }
    
    setIsUpdatingAddress(true);
    try {
      const response = await fetch('/api/portal/update-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          locationId,
          street: editStreet,
          city: editCity,
          state: editState,
          zip: editZip,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      setEditAddressOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Update address error:', error);
    } finally {
      setIsUpdatingAddress(false);
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
                        {availableCustomerIds.length > 1 && (
                          <Button
                            variant="outline"
                            onClick={handleSwitchAccount}
                            data-testid="button-switch-account"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Switch Account
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">Contact Information</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditContacts}
                            data-testid="button-edit-contacts"
                          >
                            Edit
                          </Button>
                        </div>
                        
                        {customerData.customer.contacts && customerData.customer.contacts.length > 0 ? (
                          <div className="space-y-3">
                            {customerData.customer.contacts.map((contact, index) => {
                              const isEmail = contact.type === 'Email';
                              const isPhone = contact.type === 'Phone' || contact.type === 'MobilePhone';
                              
                              if (!isEmail && !isPhone) return null;
                              
                              return (
                                <div key={contact.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  {isEmail ? (
                                    <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <PhoneIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">
                                      {contact.type === 'MobilePhone' ? 'Mobile' : contact.type}
                                    </p>
                                    <p className="font-medium break-all" data-testid={`contact-${contact.type.toLowerCase()}-${index}`}>
                                      {contact.value}
                                    </p>
                                    {contact.memo && contact.memo !== 'email' && contact.memo !== 'Phone' && contact.memo !== 'mobile' && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {contact.memo}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setContactToDelete({
                                        id: contact.id,
                                        type: contact.type,
                                        value: contact.value
                                      });
                                      setDeleteContactDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-contact-${contact.id}`}
                                    className="flex-shrink-0 text-destructive hover:text-destructive"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Phone</p>
                              <p className="font-medium" data-testid="text-customer-phone">{customerData.customer.phoneNumber || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Email</p>
                              <p className="font-medium" data-testid="text-customer-email">{customerData.customer.email || 'Not provided'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4 Dashboard Cards - Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* VIP Status Card - FIRST POSITION with visual variants */}
                    <AspectRatio ratio={1 / 1}>
                      {(() => {
                        const membership = customerData.memberships && customerData.memberships.length > 0 ? customerData.memberships[0] : null;
                        const membershipTypeName = membership?.membershipType?.toLowerCase() || '';
                        
                        // Determine variant based on membership type
                        let variant = {
                          bgClass: 'bg-background',
                          borderClass: 'border-primary/20',
                          iconClass: 'text-primary',
                          icon: Crown,
                          name: 'VIP'
                        };
                        
                        if (membershipTypeName.includes('platinum')) {
                          variant = {
                            bgClass: 'bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/20 dark:to-slate-950/20',
                            borderClass: 'border-purple-300/50 dark:border-purple-700/50',
                            iconClass: 'text-purple-600 dark:text-purple-400',
                            icon: Crown,
                            name: 'Platinum'
                          };
                        } else if (membershipTypeName.includes('silver')) {
                          variant = {
                            bgClass: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
                            borderClass: 'border-slate-300/50 dark:border-slate-600/50',
                            iconClass: 'text-slate-600 dark:text-slate-400',
                            icon: Shield,
                            name: 'Silver'
                          };
                        } else if (membershipTypeName.includes('rental')) {
                          variant = {
                            bgClass: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
                            borderClass: 'border-blue-300/50 dark:border-blue-700/50',
                            iconClass: 'text-blue-600 dark:text-blue-400',
                            icon: Building2,
                            name: 'Rental'
                          };
                        } else if (membershipTypeName.includes('commercial')) {
                          variant = {
                            bgClass: 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900',
                            borderClass: 'border-amber-400/50 dark:border-amber-500/50',
                            iconClass: 'text-amber-500 dark:text-amber-400',
                            icon: Briefcase,
                            name: 'Commercial'
                          };
                        }
                        
                        const IconComponent = variant.icon;
                        const isExpired = membership?.isExpired || false;
                        const isActive = membership && !isExpired;
                        
                        return (
                          <Card className={`hover-elevate w-full h-full overflow-hidden cursor-pointer border-2 ${variant.borderClass} ${variant.bgClass}`} data-testid="card-vip-status" onClick={() => {
                            const element = document.getElementById('vip-membership-section');
                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full h-full relative">
                              <IconComponent className={`w-8 h-8 mb-2 ${variant.iconClass}`} />
                              {isActive ? (
                                <>
                                  <div className="text-base font-bold mb-1">
                                    {variant.name} Member
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1 truncate w-full px-2">
                                    {membership.membershipType}
                                  </p>
                                  {membership.expirationDate && (
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Until {new Date(membership.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </p>
                                  )}
                                  <Badge variant="default" className="text-xs mt-1">Active</Badge>
                                </>
                              ) : isExpired && membership ? (
                                <>
                                  <div className="text-base font-bold mb-1">
                                    Membership Expired
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1 truncate w-full px-2">
                                    {membership.membershipType}
                                  </p>
                                  {membership.expirationDate && (
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Expired {new Date(membership.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </p>
                                  )}
                                  <Button size="sm" variant="default" className="text-xs mt-1" onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('/vip-membership', '_blank');
                                  }}>
                                    Renew Now
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="text-base font-bold mb-1">
                                    Not a Member
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Join our VIP Program
                                  </p>
                                  <Button size="sm" variant="default" className="text-xs" onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('/vip-membership', '_blank');
                                  }}>
                                    Start Membership
                                  </Button>
                                </>
                              )}
                              <p className="text-xs text-primary mt-2 absolute bottom-2">View Details →</p>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </AspectRatio>

                    {/* Loyal Customer Card - Service History with Enhanced Messaging */}
                    {customerStats && (
                      <AspectRatio ratio={1 / 1}>
                        {(() => {
                          // Flip the percentile: show how many they're BETTER than (not how many are better than them)
                          const betterThanPercentile = 100 - customerStats.topPercentile;
                          
                          // Determine message tier and styling based on performance
                          let message = '';
                          let icon = Heart;
                          let badgeVariant: "default" | "secondary" | "outline" = "default";
                          let emoji = '⭐';
                          
                          if (customerStats.topPercentile <= 5) {
                            // Elite tier - Top 5%
                            message = `You're in our elite ${customerStats.topPercentile}%! You've had more services than ${betterThanPercentile}% of our customers. Thank you for being such a loyal customer!`;
                            icon = Star;
                            emoji = '🌟';
                            badgeVariant = "default";
                          } else if (customerStats.topPercentile <= 25) {
                            // Great tier - Top 25%
                            message = `You've had more services than ${betterThanPercentile}% of our customers. We really appreciate your business!`;
                            icon = Heart;
                            emoji = '⭐';
                            badgeVariant = "default";
                          } else if (customerStats.topPercentile <= 50) {
                            // Good tier - Top 50%
                            message = `Thank you for choosing us! You've had more services than ${betterThanPercentile}% of our customers.`;
                            icon = Heart;
                            emoji = '✓';
                            badgeVariant = "secondary";
                          } else {
                            // Encourage more engagement
                            message = `We're here when you need us! Remember, we offer maintenance plans, emergency services, and more. Give us a call anytime at (512) 259-7222!`;
                            icon = Phone;
                            emoji = '📞';
                            badgeVariant = "outline";
                          }
                          
                          const IconComponent = icon;
                          
                          return (
                            <Card className="hover-elevate w-full h-full overflow-hidden cursor-pointer" data-testid="card-service-history" onClick={() => {
                              const element = document.getElementById('job-history-section');
                              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}>
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full h-full relative">
                                <IconComponent className="w-8 h-8 text-primary mb-2" />
                                <div className="text-base font-bold mb-1">
                                  {customerStats.topPercentile <= 5 ? 'Elite Customer!' : 
                                   customerStats.topPercentile <= 25 ? 'Valued Customer!' :
                                   customerStats.topPercentile <= 50 ? 'Thank You!' : 'We Miss You!'}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {customerStats.serviceCount} service{customerStats.serviceCount === 1 ? '' : 's'} with us
                                </p>
                                {customerStats.topPercentile <= 50 && (
                                  <Badge variant={badgeVariant} className="text-xs mb-1">
                                    {emoji} Better than {betterThanPercentile}%
                                  </Badge>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 px-2 line-clamp-3">
                                  {message}
                                </p>
                                <p className="text-xs text-primary mt-2 absolute bottom-2">View History →</p>
                              </CardContent>
                            </Card>
                          );
                        })()}
                      </AspectRatio>
                    )}

                    {/* Referrals Card - Show Account Credit */}
                    <AspectRatio ratio={1 / 1}>
                      <Card className="hover-elevate w-full h-full overflow-hidden cursor-pointer" data-testid="card-referrals" onClick={() => {
                        const element = document.getElementById('referral-section');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full h-full relative">
                          <Share2 className="w-8 h-8 text-primary mb-2" />
                          {(() => {
                            const creditedReferrals = referralsData?.referrals.filter((r: any) => r.status === 'credited') || [];
                            const totalCredit = creditedReferrals.reduce((sum: number, r: any) => sum + (r.creditAmount || 0), 0);
                            return (
                              <>
                                <div className="text-2xl font-bold text-primary mb-1" data-testid="text-account-credit">
                                  {formatCurrency(totalCredit / 100)}
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Account Credit
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {referralsData?.referrals.length || 0} referral{referralsData?.referrals.length === 1 ? '' : 's'}
                                </p>
                              </>
                            );
                          })()}
                          <p className="text-xs text-primary mt-2 absolute bottom-2">View Details →</p>
                        </CardContent>
                      </Card>
                    </AspectRatio>

                    {/* Upcoming Appointments Card - Show Next Appointment Details */}
                    <AspectRatio ratio={1 / 1}>
                      <Card className="hover-elevate w-full h-full overflow-hidden cursor-pointer" data-testid="card-upcoming-appointments" onClick={() => {
                        const element = document.getElementById('appointments-section');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full h-full relative">
                          <Calendar className="w-8 h-8 text-primary mb-2" />
                          {upcomingAppointments.length > 0 ? (
                            <>
                              <div className="text-base font-bold mb-1" data-testid="text-next-appointment-date">
                                {new Date(upcomingAppointments[0].start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {formatTime(upcomingAppointments[0].start)}
                              </p>
                              {upcomingAppointments[0].businessUnitName && (
                                <p className="text-xs text-muted-foreground truncate w-full px-1">
                                  {upcomingAppointments[0].businessUnitName}
                                </p>
                              )}
                              {upcomingAppointments.length > 1 && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  +{upcomingAppointments.length - 1} more
                                </Badge>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-base font-bold mb-1">
                                None Scheduled
                              </div>
                              <p className="text-xs text-muted-foreground">
                                No upcoming appointments
                              </p>
                            </>
                          )}
                          <p className="text-xs text-primary mt-2 absolute bottom-2">View All →</p>
                        </CardContent>
                      </Card>
                    </AspectRatio>
                  </div>

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
                  <div id="vip-membership-section">
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
                  </div>

                  {/* Service Locations */}
                  {customerLocations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-primary" />
                          <CardTitle>Service Locations ({customerLocations.length})</CardTitle>
                        </div>
                        <CardDescription>
                          {customerLocations.length === 1 
                            ? "Your service address" 
                            : "All your service addresses"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {customerLocations.map((location, index) => (
                          <div
                            key={location.id}
                            className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border"
                            data-testid={`location-card-${location.id}`}
                          >
                            <Home className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              {location.name && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {location.name}
                                </p>
                              )}
                              <p className="font-medium" data-testid={`text-location-street-${location.id}`}>
                                {location.address.street}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {location.address.city}, {location.address.state} {location.address.zip}
                              </p>
                              {index === 0 && customerLocations.length > 1 && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLocationId(location.id);
                                setEditStreet(location.address.street || '');
                                setEditCity(location.address.city || '');
                                setEditState(location.address.state || '');
                                setEditZip(location.address.zip || '');
                                setEditAddressOpen(true);
                              }}
                              data-testid={`button-edit-location-${location.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          Click the edit button to update any service address
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Estimates Carousel - Show ALL unsold estimates */}
                  {(() => {
                    // Show ALL estimates that haven't been sold/converted - includes Open, Pending, Sent, Draft, Expired, etc.
                    const unsoldEstimates = customerData.estimates?.filter(estimate => {
                      const status = (estimate.status || '').toLowerCase();
                      // Only filter out truly final states (sold, approved, declined, converted)
                      return !status.includes('sold') && 
                             !status.includes('approved') && 
                             !status.includes('declined') && 
                             !status.includes('converted');
                    }) || [];

                    if (unsoldEstimates.length === 0) return null;

                    return (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            <CardTitle>Your Estimates</CardTitle>
                          </div>
                          <CardDescription>
                            All estimates and quotes for your review
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto pb-2">
                            <div className="flex gap-4 min-w-max">
                              {unsoldEstimates.map((estimate) => (
                                <Card
                                  key={estimate.id}
                                  className="w-80 flex-shrink-0 hover-elevate active-elevate-2 cursor-pointer"
                                  onClick={() => {
                                    setSelectedEstimate(estimate);
                                    setEstimateDetailOpen(true);
                                  }}
                                  data-testid={`estimate-card-${estimate.id}`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                      <div>
                                        <h4 className="font-semibold">Estimate #{estimate.estimateNumber}</h4>
                                        {estimate.summary && (
                                          <p className="text-sm text-muted-foreground line-clamp-1">{estimate.summary}</p>
                                        )}
                                      </div>
                                      {getStatusBadge(estimate.status)}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total:</span>
                                        <span className="font-semibold text-primary">{formatCurrency(estimate.total)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{formatDate(estimate.createdOn)}</span>
                                      </div>
                                      {estimate.expiresOn && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Expires:</span>
                                          <span>{formatDate(estimate.expiresOn)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Upcoming Appointments */}
                  <div id="appointments-section">
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
                  </div>

                  {/* Invoices */}
                  <div id="job-history-section">
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
                                    onClick={() => handleRequestPDF('invoice', invoice.invoiceNumber, invoice.id, {
                                      customerId: customerData.customer.id,
                                      customerName: customerData.customer.name,
                                      customerEmail: customerData.customer.email
                                    })}
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
                  </div>

                  {/* Consolidated Referral Section */}
                  <div id="referral-section">
                  {referralLinkData && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <Gift className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle>Referral Rewards Program</CardTitle>
                              <CardDescription className="mt-1">
                                Earn $25 for every friend you refer!
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-primary">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Referral Code */}
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Your Referral Code</p>
                          <p className="text-2xl font-bold text-primary tracking-wide" data-testid="text-referral-code">
                            {referralLinkData.code}
                          </p>
                        </div>

                        {/* Referral Link */}
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
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-background rounded-lg border text-center">
                            <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                            <p className="text-2xl font-bold text-primary" data-testid="text-total-referrals-stat">
                              {referralsData?.referrals.length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border text-center">
                            <p className="text-sm text-muted-foreground mb-1">Conversions</p>
                            <p className="text-2xl font-bold text-primary" data-testid="text-conversions">
                              {referralLinkData.conversions}
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border text-center">
                            <p className="text-sm text-muted-foreground mb-1">Clicks</p>
                            <p className="text-2xl font-bold" data-testid="text-clicks">
                              {referralLinkData.clicks}
                            </p>
                          </div>
                        </div>

                        {/* Your Referrals List */}
                        {referralsData && referralsData.referrals.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold">Your Referrals</h4>
                            {referralsData.referrals.slice(0, 5).map((referral: any) => {
                              const isReferrer = referral.referrerCustomerId === parseInt(customerId!);
                              const statusColors: Record<string, string> = {
                                pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
                                contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
                                job_completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
                                credited: 'bg-primary/10 text-primary'
                              };
                              
                              return (
                                <div key={referral.id} className="p-3 bg-background rounded-lg border">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="font-medium text-sm">
                                      {isReferrer ? referral.refereeName : referral.referrerName}
                                    </p>
                                    <Badge className={statusColors[referral.status] || 'bg-gray-100 text-gray-800'} data-testid={`badge-referral-status-${referral.id}`}>
                                      {referral.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Submitted: {new Date(referral.submittedAt).toLocaleDateString()}
                                  </p>
                                  {referral.status === 'credited' && referral.creditAmount && (
                                    <p className="text-xs text-primary font-medium mt-1">
                                      Credit: ${(referral.creditAmount / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            {referralsData.referrals.length > 5 && (
                              <p className="text-xs text-center text-muted-foreground">
                                Showing 5 most recent ({referralsData.referrals.length} total)
                              </p>
                            )}
                          </div>
                        )}

                        {/* How It Works */}
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

                        {/* Action Button */}
                        <Button
                          onClick={() => setShowReferralModal(true)}
                          className="w-full"
                          size="lg"
                          data-testid="button-share-referral"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Referral Link
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  </div>

                  {/* Leave a Review (show if they have completed appointments) */}
                  {completedAppointments.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-primary fill-primary" />
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
                        
                        <Button
                          asChild
                          className="w-full"
                          size="lg"
                          data-testid="button-leave-review"
                        >
                          <a href="/request-review">
                            <Star className="w-4 h-4 mr-2" />
                            Leave a Review
                          </a>
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          Choose from Google, Facebook, BBB, or Yelp - takes just 2 minutes!
                        </p>
                      </CardContent>
                    </Card>
                  )}
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

      {/* Estimate Detail Modal */}
      <Dialog open={estimateDetailOpen} onOpenChange={setEstimateDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-estimate-detail">
          <DialogHeader>
            <DialogTitle>Estimate Details</DialogTitle>
            <DialogDescription>
              Complete breakdown of your estimate
            </DialogDescription>
          </DialogHeader>
          
          {selectedEstimate && (
            <div className="space-y-4">
              {/* Estimate Header */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Estimate #{selectedEstimate.estimateNumber}</h3>
                    {selectedEstimate.summary && (
                      <p className="text-sm text-muted-foreground">{selectedEstimate.summary}</p>
                    )}
                  </div>
                  {getStatusBadge(selectedEstimate.status)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total:</p>
                    <p className="font-semibold text-lg text-primary">{formatCurrency(selectedEstimate.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created:</p>
                    <p className="font-medium">{formatDate(selectedEstimate.createdOn)}</p>
                  </div>
                  {selectedEstimate.expiresOn && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Expires:</p>
                        <p className="font-medium">{formatDate(selectedEstimate.expiresOn)}</p>
                      </div>
                    </>
                  )}
                  {selectedEstimate.jobNumber && (
                    <div>
                      <p className="text-muted-foreground">Job #:</p>
                      <p className="font-medium">{selectedEstimate.jobNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate Items */}
              <div className="space-y-3">
                <h4 className="font-semibold">Items</h4>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {selectedEstimate.items && selectedEstimate.items.length > 0 ? (
                    selectedEstimate.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-background rounded-lg border" data-testid={`estimate-item-${index}`}>
                        <div className="flex gap-3">
                          {item.pricebookDetails?.imageUrl && (
                            <img 
                              src={item.pricebookDetails.imageUrl} 
                              alt={item.pricebookDetails.name || item.description}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.pricebookDetails?.name || item.description || 'Service Item'}
                            </p>
                            {item.description && item.pricebookDetails?.name && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-muted-foreground">
                                Qty: {item.quantity || 1}
                              </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(item.price || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No items found</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEstimateDetailOpen(false)}
                  data-testid="button-close-estimate-detail"
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleRequestPDF('estimate', selectedEstimate.estimateNumber, selectedEstimate.id, {
                      customerId: customerData!.customer.id,
                      customerName: customerData!.customer.name,
                      customerEmail: customerData!.customer.email
                    });
                    setEstimateDetailOpen(false);
                  }}
                  data-testid="button-request-estimate-pdf-modal"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Request PDF Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Edit Contacts Dialog */}
      <Dialog open={editContactsOpen} onOpenChange={setEditContactsOpen}>
        <DialogContent data-testid="dialog-edit-contacts">
          <DialogHeader>
            <DialogTitle>Update Contact Information</DialogTitle>
            <DialogDescription>
              Update your phone number and email address. This will be reflected in our system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(512) 123-4567"
                data-testid="input-edit-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="input-edit-email"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Changes will update your contact information across all our systems.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditContactsOpen(false)}
              disabled={isUpdatingContacts}
              data-testid="button-cancel-edit-contacts"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContacts}
              disabled={isUpdatingContacts || (!editPhone && !editEmail)}
              data-testid="button-save-contacts"
            >
              {isUpdatingContacts ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <DialogContent data-testid="dialog-delete-contact">
          <DialogHeader>
            <DialogTitle>Delete Contact?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact information? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {contactToDelete && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {contactToDelete.type === 'MobilePhone' ? 'Mobile' : contactToDelete.type}
                </p>
                <p className="font-medium">
                  {contactToDelete.value}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteContactDialogOpen(false);
                setContactToDelete(null);
              }}
              disabled={isDeletingContact}
              data-testid="button-cancel-delete-contact"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContact}
              disabled={isDeletingContact}
              data-testid="button-confirm-delete-contact"
            >
              {isDeletingContact ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
        <DialogContent data-testid="dialog-edit-address">
          <DialogHeader>
            <DialogTitle>Update Service Address</DialogTitle>
            <DialogDescription>
              Update your service address where we provide plumbing services.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-street">Street Address</Label>
              <Input
                id="edit-street"
                type="text"
                value={editStreet}
                onChange={(e) => setEditStreet(e.target.value)}
                placeholder="123 Main Street"
                data-testid="input-edit-street"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Austin"
                  data-testid="input-edit-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="TX"
                  maxLength={2}
                  data-testid="input-edit-state"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-zip">ZIP Code</Label>
              <Input
                id="edit-zip"
                type="text"
                value={editZip}
                onChange={(e) => setEditZip(e.target.value)}
                placeholder="78701"
                maxLength={5}
                data-testid="input-edit-zip"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: This updates your primary service address in our system.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditAddressOpen(false)}
              disabled={isUpdatingAddress}
              data-testid="button-cancel-edit-address"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAddress}
              disabled={isUpdatingAddress || !editStreet || !editCity || !editState || !editZip}
              data-testid="button-save-address"
            >
              {isUpdatingAddress ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Switcher Dialog */}
      <Dialog open={showAccountSelection && verificationStep === 'authenticated'} onOpenChange={setShowAccountSelection}>
        <DialogContent className="max-w-2xl" data-testid="dialog-switch-account">
          <DialogHeader>
            <DialogTitle>Switch Account</DialogTitle>
            <DialogDescription>
              Select which account you'd like to view. You have access to multiple accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {availableAccounts.map((account) => (
              <Card
                key={account.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => handleSelectAccount(account.id)}
                data-testid={`switch-account-option-${account.id}`}
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAccountSelection(false)}
              data-testid="button-cancel-switch"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
