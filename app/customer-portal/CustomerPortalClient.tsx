'use client';

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/phoneUtils";
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
import type { PhoneConfig } from "@/server/lib/phoneNumbers";
import { ReferralModal } from "@/components/ReferralModal";
import { VouchersSection } from "./VouchersSection";
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
  Briefcase,
  Receipt,
  Loader2
} from "lucide-react";
import { SiFacebook, SiX } from "react-icons/si";
import { SchedulerDialog } from "./SchedulerDialog";

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
  customerTags?: string[];
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
  type?: string;
  address?: string;
  email?: string | null;
  maskedEmail?: string | null;
  phoneNumber?: string;
}

interface CustomerPortalClientProps {
  phoneConfig: PhoneConfig;
  marbleFallsPhoneConfig: PhoneConfig;
}

export default function CustomerPortalClient({ phoneConfig, marbleFallsPhoneConfig }: CustomerPortalClientProps) {
  const [lookupValue, setLookupValue] = useState("");
  const [lookupType, setLookupType] = useState<"phone" | "email">("phone");
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
  const [isLoadingSwitcher, setIsLoadingSwitcher] = useState(false);
  
  // Verification state
  const [verificationStep, setVerificationStep] = useState<'lookup' | 'verify-code' | 'phone-lookup' | 'phone-email-found' | 'select-email' | 'select-account' | 'authenticated'>('lookup');
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Email selection state
  const [availableEmails, setAvailableEmails] = useState<Array<{ masked: string; value: string }>>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  
  // Phone-based login state
  const [phoneLoginNumber, setPhoneLoginNumber] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [actualEmail, setActualEmail] = useState(""); // Store actual email for verification
  const [lookupToken, setLookupToken] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  
  // Reschedule state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<ServiceTitanAppointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState("");
  const [newAppointmentWindow, setNewAppointmentWindow] = useState("");
  const [rescheduleSpecialInstructions, setRescheduleSpecialInstructions] = useState("");
  const [rescheduleGrouponVoucher, setRescheduleGrouponVoucher] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{
    id: string;
    start: string;
    end: string;
    timeLabel: string;
    proximityScore: number;
  }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Cancel appointment state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<ServiceTitanAppointment & { jobId?: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);
  
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
  
  // Email Us modal state
  const [emailUsOpen, setEmailUsOpen] = useState(false);
  const [emailUsSubject, setEmailUsSubject] = useState("");
  const [emailUsMessage, setEmailUsMessage] = useState("");
  const [emailUsName, setEmailUsName] = useState("");
  const [emailUsEmail, setEmailUsEmail] = useState("");
  const [emailUsPhone, setEmailUsPhone] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  
  // Scheduler dialog state
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  // Estimate detail modal state
  const [estimateDetailOpen, setEstimateDetailOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ServiceTitanEstimate | null>(null);
  
  // Estimate acceptance state
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [isAcceptingEstimate, setIsAcceptingEstimate] = useState(false);
  const [acceptanceTermsAgreed, setAcceptanceTermsAgreed] = useState(false);
  
  // Add location state
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [newLocationData, setNewLocationData] = useState({
    address: '',
    city: 'Austin',
    state: 'TX',
    zipCode: '',
    specialInstructions: '',
  });
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  
  // Add customer contact state
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactType, setNewContactType] = useState<'Phone' | 'MobilePhone' | 'Email'>('Phone');
  const [newContactValue, setNewContactValue] = useState("");
  const [newContactMemo, setNewContactMemo] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Manage location contacts state
  const [manageLocationContactsOpen, setManageLocationContactsOpen] = useState(false);
  const [selectedLocationForContacts, setSelectedLocationForContacts] = useState<any>(null);
  const [newLocationContactType, setNewLocationContactType] = useState<'Phone' | 'MobilePhone' | 'Email'>('Phone');
  const [newLocationContactValue, setNewLocationContactValue] = useState("");
  const [newLocationContactName, setNewLocationContactName] = useState("");
  const [newLocationContactMemo, setNewLocationContactMemo] = useState("");
  const [isAddingLocationContact, setIsAddingLocationContact] = useState(false);
  
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

  // Fetch recent job completions (for technician rating)
  const { data: recentJobsData, refetch: refetchRecentJobs } = useQuery<{
    jobs: Array<{
      id: string;
      jobId: number;
      completionDate: Date;
      serviceName: string | null;
      technicianName: string | null;
      invoiceTotal: number | null;
      technicianRating: number | null;
      ratedAt: Date | null;
    }>;
  }>({
    queryKey: ['/api/portal/recent-jobs', customerId],
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
    queryKey: [`/api/portal/customer-locations/${customerId}`],
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
  const upcomingAppointments = (customerData?.appointments || []).filter(apt => {
    const isUpcoming = new Date(apt.start) > new Date();
    const isNotCompleted = !['Done', 'Completed', 'Cancelled'].includes(apt.status);
    return isUpcoming && isNotCompleted;
  });

  const completedAppointments = (customerData?.appointments || []).filter(apt => {
    const isPast = new Date(apt.start) <= new Date();
    const isCompleted = ['Done', 'Completed', 'Cancelled'].includes(apt.status);
    return isPast || isCompleted;
  });

  // Clear session on page load/refresh
  useEffect(() => {
    const clearSession = async () => {
      try {
        await fetch('/api/portal/logout', { method: 'POST' });
        console.log('[Portal] Session cleared on page load');
      } catch (error) {
        console.error('[Portal] Error clearing session:', error);
      }
    };
    
    clearSession();
  }, []);

  // Check for magic link token on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Auto-verify email magic link
      handleMagicLinkVerification(token);
    }
  }, []);
  

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
      
      // Check if email selection is required
      if (result.requiresEmailSelection && result.emails) {
        setAvailableEmails(result.emails);
        setVerificationStep('select-email');
        setLookupSuccess(result.message);
      } else {
        // Move to verification step
        setVerificationStep('verify-code');
        setVerificationMessage(result.message);
        setLookupSuccess(result.message);
      }
    } catch (err: any) {
      console.error('Customer lookup failed:', err);
      setLookupError(err.message || 'We couldn\'t find an account with that information. Please verify and try again.');
    } finally {
      setIsSearching(false);
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
      // Now send code to the selected email ONLY
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
      
      // Update lookupValue to the selected email for verification
      setLookupValue(selectedEmail);
      
      // Move to verification step
      setVerificationStep('verify-code');
      setVerificationMessage(result.message);
      setLookupSuccess(result.message);
    } catch (err: any) {
      console.error('Email send failed:', err);
      setLookupError(err.message || 'Failed to send verification code');
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
      // If we're in the select-account step (initial auth from phone lookup)
      if (verificationStep === 'select-account') {
        const selectedAccount = availableAccounts.find(a => a.id === accountId);
        if (!selectedAccount) {
          throw new Error('Selected account not found');
        }

        console.log(`[Portal] User selected account ${accountId}: ${selectedAccount.name}`);

        // Check if account has email for verification
        if (!selectedAccount.email) {
          setLookupError('This account has no email address. SMS verification is not yet implemented. Please contact support.');
          return;
        }

        // Parse emails (could be multiple comma-separated)
        const emails = selectedAccount.email
          .split(',')
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0 && e.includes('@'));

        if (emails.length === 0) {
          setLookupError('This account has no valid email address. Please contact support.');
          return;
        }

        // Helper to mask email
        const maskEmail = (email: string) => {
          const [localPart, domain] = email.split('@');
          if (!localPart || !domain) return email;
          const visibleChars = Math.min(2, localPart.length);
          const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(3, localPart.length - visibleChars));
          return `${maskedLocal}@${domain}`;
        };

        // If multiple emails, show email selector
        if (emails.length > 1) {
          console.log(`[Portal] Account has ${emails.length} emails, showing selector`);
          // Use correct format: { masked, value }
          setAvailableEmails(emails.map((email: string) => ({
            masked: maskEmail(email),
            value: email
          })));
          setVerificationStep('select-email');
          setLookupSuccess('Please select which email to use for verification.');
        } else {
          // Single email - proceed directly to send verification code
          const email = emails[0];
          const maskedEmail = maskEmail(email);
          console.log(`[Portal] Account has single email, proceeding with verification`);
          
          // CRITICAL: Set lookupValue so verification code uses this email
          setLookupValue(email);
          setActualEmail(email);
          setMaskedEmail(maskedEmail);
          setVerificationStep('phone-email-found');
          setLookupSuccess(`We'll send a verification code to ${maskedEmail}`);
        }

        // Store the selected customer ID for later use
        setCustomerId(accountId.toString());
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
        
        // Invalidate ALL queries to refresh all data for the new account
        queryClient.invalidateQueries();
      }
    } catch (error: any) {
      console.error('Account switch error:', error);
      setLookupError('Failed to switch account. Please try again.');
    }
  };

  const handleSwitchAccount = async () => {
    // If we have multiple accounts stored in availableCustomerIds, fetch their details
    if (availableCustomerIds.length > 1) {
      setIsLoadingSwitcher(true);
      try {
        // Fetch account details for all available customer IDs
        const accountPromises = availableCustomerIds.map(async (id) => {
          const response = await fetch(`/api/servicetitan/customer/${id}`);
          const data = await response.json();
          
          return {
            id: data.customer.id,
            name: data.customer.name,
            type: 'Residential', // No longer displaying type, keeping for compatibility
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
      } finally {
        setIsLoadingSwitcher(false);
      }
    }
  };

  const handleBackToLookup = () => {
    setVerificationStep('lookup');
    setVerificationCode("");
    setLookupError(null);
    setVerificationMessage("");
    setPhoneLoginNumber("");
    setMaskedEmail("");
    setActualEmail("");
    setLookupToken("");
  };

  // Phone-based login handlers
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
      
      // Handle multiple accounts (requires account selection first)
      if (result.requiresAccountSelection && result.customers) {
        console.log(`[Portal] Found ${result.customers.length} accounts for this phone number`);
        
        // Map backend customers to frontend CustomerAccount format
        const accounts: CustomerAccount[] = result.customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          maskedEmail: c.maskedEmail,
          phoneNumber: result.phone,
        }));
        
        setAvailableAccounts(accounts);
        setAvailableCustomerIds(accounts.map(a => a.id));
        setVerificationStep('select-account');
        setLookupSuccess(result.message || 'We found multiple accounts. Please select your account.');
      }
      // Handle multiple emails (requires selection)
      else if (result.requiresSelection && result.emailOptions) {
        setAvailableEmails(result.emailOptions);
        setLookupToken(result.lookupToken);
        setVerificationStep('select-email');
        setLookupSuccess('We found your account! Please select which email to use for verification.');
      } 
      // Handle SMS-only customers (no email)
      else if (result.requiresSms) {
        setLookupError('SMS verification is not yet implemented. Please contact support.');
        // TODO: Implement SMS verification flow
      }
      // Handle single email (auto-select)
      else {
        setMaskedEmail(result.maskedEmail);
        setActualEmail(result.email); // Store actual email for sending verification code
        setLookupToken(result.lookupToken);
        setVerificationStep('phone-email-found');
        setLookupSuccess(`We found your account! We'll send a verification code to ${result.maskedEmail}`);
      }
    } catch (err: any) {
      console.error('Phone lookup failed:', err);
      setLookupError(err.message || 'We couldn\'t find an account with that phone number.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSendPhoneVerificationCode = async () => {
    setLookupError(null);
    setLookupSuccess(null);
    setIsSendingLink(true);

    try {
      const response = await fetch('/api/portal/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: actualEmail, // Use the actual email from phone lookup
          verificationType: 'email',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send verification code');
      }

      const result = await response.json();
      
      setVerificationStep('verify-code');
      setLookupSuccess(result.message || `Verification code sent to ${maskedEmail}!`);
      toast({
        title: "Check your email!",
        description: `We've sent a 6-digit code to ${maskedEmail}`,
      });
    } catch (err: any) {
      console.error('Send verification code failed:', err);
      setLookupError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleOpenRescheduleDialog = (appointment: ServiceTitanAppointment) => {
    setAppointmentToReschedule(appointment);
    
    // Pre-fill with current appointment date
    const appointmentDate = new Date(appointment.start);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    setNewAppointmentDate(dateStr);
    
    // Clear previous selections
    setNewAppointmentWindow("");
    setAvailableSlots([]);
    
    setRescheduleDialogOpen(true);
  };

  // Fetch smart availability slots when date changes
  useEffect(() => {
    const fetchSmartSlots = async () => {
      if (!newAppointmentDate || !rescheduleDialogOpen || customerLocations.length === 0) {
        return;
      }

      setIsLoadingSlots(true);
      try {
        // Use first location's ZIP code to fetch availability
        const customerZip = customerLocations[0]?.address?.zip;
        if (!customerZip) {
          console.warn('[Reschedule] No ZIP code found for customer');
          setIsLoadingSlots(false);
          return;
        }

        const response = await fetch('/api/scheduler/smart-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTypeId: 140551181, // Standard plumbing
            customerZip,
            startDate: newAppointmentDate,
            endDate: newAppointmentDate, // Same day
          }),
        });

        const data = await response.json();

        if (data.success && data.slots) {
          // Take top 10 most efficient slots
          setAvailableSlots(data.slots.slice(0, 10));
          
          // Auto-select first slot if available
          if (data.slots.length > 0 && !newAppointmentWindow) {
            setNewAppointmentWindow(data.slots[0].id);
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error('[Reschedule] Error fetching smart slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSmartSlots();
  }, [newAppointmentDate, rescheduleDialogOpen, customerLocations, newAppointmentWindow]);

  const handleRescheduleAppointment = async () => {
    if (!appointmentToReschedule || !newAppointmentDate || !newAppointmentWindow) {
      return;
    }

    setIsRescheduling(true);

    try {
      // Find the selected slot from available slots
      const selectedSlot = availableSlots.find(slot => slot.id === newAppointmentWindow);
      
      if (!selectedSlot) {
        throw new Error("Selected time slot is no longer available. Please choose another time.");
      }

      const response = await fetch('/api/customer-portal/reschedule-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentToReschedule.id,
          start: selectedSlot.start,
          end: selectedSlot.end,
          arrivalWindowStart: selectedSlot.start,
          arrivalWindowEnd: selectedSlot.end,
          specialInstructions: rescheduleSpecialInstructions || undefined,
          grouponVoucher: rescheduleGrouponVoucher || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule appointment');
      }

      toast({
        title: "Success!",
        description: "Your appointment has been rescheduled",
      });

      // Refresh customer data
      queryClient.invalidateQueries({ queryKey: ['/api/customer-portal/account'] });
      
      setRescheduleDialogOpen(false);
      setRescheduleSpecialInstructions("");
      setRescheduleGrouponVoucher("");
    } catch (error: any) {
      console.error('Reschedule error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to reschedule appointment',
        variant: "destructive",
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleOpenCancelDialog = (appointment: ServiceTitanAppointment & { jobId?: number; jobNumber?: string }) => {
    setAppointmentToCancel(appointment);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) {
      return;
    }

    // Need jobId to cancel - try to extract from jobNumber if not directly available
    const jobId = appointmentToCancel.jobId;
    
    if (!jobId) {
      toast({
        title: "Error",
        description: "Unable to cancel this appointment. Please call us for assistance.",
        variant: "destructive",
      });
      return;
    }

    setIsCanceling(true);

    try {
      const response = await fetch('/api/customer-portal/cancel-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          reason: cancelReason || 'Canceled by customer',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel appointment');
      }

      toast({
        title: "Appointment Canceled",
        description: "Your appointment has been successfully canceled",
      });

      // Refresh customer data
      queryClient.invalidateQueries({ queryKey: ['/api/customer-portal/account'] });
      
      setCancelDialogOpen(false);
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to cancel appointment',
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
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

      toast({
        title: "PDF Request Received",
        description: `We'll email the ${type} PDF to ${customerInfo.customerEmail} by the next business day.`,
      });
    } catch (error) {
      console.error('PDF request failed:', error);
      toast({
        title: "Request Failed",
        description: `Unable to send the PDF request. Please try again or contact support.`,
        variant: "destructive",
      });
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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/portal/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Clear state and redirect to portal home
      setCustomerId(null);
      setAvailableCustomerIds([]);
      setVerificationStep('lookup');
      setLookupType('phone');
      setLookupValue('');
      setVerificationCode('');
      
      // Show success message
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
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

  const handleAddLocation = async () => {
    if (!customerId || !newLocationData.address || !newLocationData.zipCode) {
      toast({
        title: 'Missing Information',
        description: 'Please provide the street address and ZIP code.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingLocation(true);
    try {
      const response = await fetch('/api/portal/add-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          address: newLocationData.address,
          city: newLocationData.city,
          state: newLocationData.state,
          zipCode: newLocationData.zipCode,
          specialInstructions: newLocationData.specialInstructions || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add location');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/portal/customer-locations', customerId] });

      toast({
        title: 'Location Added!',
        description: 'Your new service address has been added successfully.',
      });

      setAddLocationOpen(false);
      setNewLocationData({
        address: '',
        city: 'Austin',
        state: 'TX',
        zipCode: '',
        specialInstructions: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingLocation(false);
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

  const getExpirationBadge = (estimate: any) => {
    if (!estimate.expirationStatus) return null;
    
    if (estimate.expirationStatus === 'expired') {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (estimate.expirationStatus === 'expiring_soon') {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          Expires in {estimate.daysUntilExpiration} days
        </Badge>
      );
    }
    // Valid - show days remaining if less than 30
    if (estimate.daysUntilExpiration < 30) {
      return (
        <Badge variant="outline" className="text-xs">
          Valid for {estimate.daysUntilExpiration} days
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Header 
        isPortalAuthenticated={verificationStep === 'authenticated'} 
        onPortalLogout={handleLogout} 
      />

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {verificationStep === 'authenticated' && customerData ? (() => {
                const hour = new Date().getHours();
                const day = new Date().getDay();
                const month = new Date().getMonth();
                const serviceCount = customerStats?.serviceCount || 0;
                const firstName = customerData.customer.name?.split(' ')[0] || 'there';
                
                // Build a pool of possible greetings
                const greetings: string[] = [];
                
                // Time-based greetings
                if (hour < 12) {
                  greetings.push(`Good morning, ${firstName}!`);
                  greetings.push(`Rise and shine, ${firstName}!`);
                  greetings.push(`Morning, ${firstName}! Ready to tackle the day?`);
                } else if (hour < 17) {
                  greetings.push(`Good afternoon, ${firstName}!`);
                  greetings.push(`Hey ${firstName}, hope your day is going well!`);
                  greetings.push(`Afternoon, ${firstName}!`);
                } else {
                  greetings.push(`Good evening, ${firstName}!`);
                  greetings.push(`Evening, ${firstName}!`);
                  greetings.push(`Hey ${firstName}, winding down for the day?`);
                }
                
                // Day-specific greetings
                if (day === 1) {
                  greetings.push(`Happy Monday, ${firstName}!`);
                  greetings.push(`Monday motivation, ${firstName}!`);
                } else if (day === 5) {
                  greetings.push(`TGIF, ${firstName}!`);
                  greetings.push(`Happy Friday, ${firstName}!`);
                } else if (day === 0 || day === 6) {
                  greetings.push(`Happy weekend, ${firstName}!`);
                  greetings.push(`Enjoying your weekend, ${firstName}?`);
                }
                
                // Loyalty-based greetings
                if (serviceCount > 20) {
                  greetings.push(`Welcome back, ${firstName}! You're practically family!`);
                  greetings.push(`Hey ${firstName}, our VIP customer!`);
                  greetings.push(`${firstName}, always great to see you!`);
                } else if (serviceCount > 10) {
                  greetings.push(`Welcome back, ${firstName}! Thanks for your loyalty!`);
                  greetings.push(`Great to see you again, ${firstName}!`);
                } else if (serviceCount > 5) {
                  greetings.push(`Welcome back, ${firstName}!`);
                  greetings.push(`Good to see you, ${firstName}!`);
                } else if (serviceCount === 0) {
                  greetings.push(`Welcome, ${firstName}! Excited to serve you!`);
                  greetings.push(`Hello ${firstName}! Let's get started!`);
                } else {
                  greetings.push(`Welcome back, ${firstName}!`);
                  greetings.push(`Hello again, ${firstName}!`);
                }
                
                // Seasonal greetings
                if (month === 11) {
                  greetings.push(`Happy holidays, ${firstName}!`);
                  greetings.push(`Season's greetings, ${firstName}!`);
                } else if (month === 0) {
                  greetings.push(`Happy New Year, ${firstName}!`);
                } else if (month === 6 || month === 7) {
                  greetings.push(`Enjoying the summer, ${firstName}?`);
                  greetings.push(`Stay cool, ${firstName}!`);
                } else if (month === 2 || month === 3) {
                  greetings.push(`Happy spring, ${firstName}!`);
                } else if (month === 9 || month === 10) {
                  greetings.push(`Happy fall, ${firstName}!`);
                }
                
                // General encouraging greetings
                greetings.push(`Hey ${firstName}! How can we help today?`);
                greetings.push(`${firstName}, great to have you here!`);
                greetings.push(`Welcome, ${firstName}!`);
                greetings.push(`Hello ${firstName}! What brings you here today?`);
                greetings.push(`${firstName}, we're here to help!`);
                
                // Pick a random greeting from the pool
                const randomIndex = Math.floor(Math.random() * greetings.length);
                return greetings[randomIndex];
              })() : 'Customer Portal'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {verificationStep === 'authenticated' ? 
                'Your service history, appointments, and account details' :
                'Access your service history, appointments, and invoices'
              }
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
                    {isSearching ? 'Searching...' : 'Send Verification Code'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setVerificationStep('phone-lookup')}
                    className="w-full"
                    data-testid="button-phone-login"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Login with Phone Number
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
            ) : verificationStep === 'phone-lookup' ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Login with Phone Number</CardTitle>
                  <CardDescription>
                    Enter your phone number and we'll send a verification code to your email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-lookup-input">
                      Phone Number
                    </Label>
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

                  <Button
                    variant="ghost"
                    onClick={handleBackToLookup}
                    className="w-full"
                    data-testid="button-back-to-email"
                  >
                    Back to Email Login
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
            ) : verificationStep === 'phone-email-found' ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Account Found!</CardTitle>
                  <CardDescription>
                    We'll send a verification code to your email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Email Address</p>
                        <p className="text-sm text-muted-foreground">
                          {maskedEmail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          For security, we've hidden part of your email address
                        </p>
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
            ) : verificationStep === 'select-email' ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Select Email Address</CardTitle>
                  <CardDescription>
                    Multiple email addresses found. Choose which one to send the verification code to.
                  </CardDescription>
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
                    <p className="text-xs text-muted-foreground mt-2">
                      For security, parts of the email addresses are hidden
                    </p>
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
                      6-Digit Verification Code
                    </Label>
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
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to {lookupValue}
                    </p>
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
            ) : null
          ) : (
            <div className="space-y-6">
              {isLoading ? (
                <div className="relative">
                  {/* Full-screen loading overlay */}
                  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8 max-w-md">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Loading Your Account</h3>
                        <p className="text-muted-foreground">
                          We're fetching your service history, appointments, and account details...
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background skeleton structure for visual reference */}
                  <div className="space-y-6 opacity-30 pointer-events-none">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-32" />
                          <Skeleton className="h-10 w-28" />
                          <Skeleton className="h-10 w-24" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-32" />
                          <div className="grid md:grid-cols-2 gap-4">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                          </div>
                          <Skeleton className="h-4 w-32 mt-6" />
                          <div className="space-y-2">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-20" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32 mt-2" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-40" />
                          <Skeleton className="h-4 w-28 mt-2" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-48 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Skeleton className="h-40" />
                          <Skeleton className="h-40" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
                  {/* Primary Account Information Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <User className="w-8 h-8 text-primary" />
                          <div>
                            <CardTitle>{customerData.customer.name}</CardTitle>
                            <CardDescription>Account Information</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => setSchedulerOpen(true)}
                            data-testid="button-schedule-appointment"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            data-testid="button-call"
                          >
                            <a href={`tel:${phoneConfig.tel}`}>
                              <PhoneIcon className="w-4 h-4 mr-2" />
                              Call
                            </a>
                          </Button>
                          {availableCustomerIds.length > 1 && (
                            <Button
                              variant="outline"
                              onClick={handleSwitchAccount}
                              disabled={isLoadingSwitcher}
                              data-testid="button-switch-account"
                            >
                              {isLoadingSwitcher ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Users className="w-4 h-4 mr-2" />
                                  Switch Account
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Contact Information Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <PhoneIcon className="w-4 h-4 text-primary" />
                              Contact Information
                            </h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAddContactOpen(true)}
                                data-testid="button-add-contact"
                              >
                                Add
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditContacts}
                                data-testid="button-edit-contacts"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                          
                          {customerData.customer.contacts && customerData.customer.contacts.length > 0 ? (
                            <div className="space-y-2">
                              {customerData.customer.contacts.map((contact, index) => {
                                const isEmail = contact.type === 'Email';
                                const isPhone = contact.type === 'Phone' || contact.type === 'MobilePhone';
                                
                                if (!isEmail && !isPhone) return null;
                                
                                return (
                                  <div key={contact.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                                    {isEmail ? (
                                      <Mail className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <PhoneIcon className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground">
                                        {contact.type === 'MobilePhone' ? 'Mobile' : contact.type}
                                      </p>
                                      <p className="text-sm font-medium break-all" data-testid={`contact-${contact.type.toLowerCase()}-${index}`}>
                                        {isEmail ? contact.value : formatPhoneNumber(contact.value)}
                                      </p>
                                      {contact.memo && contact.memo !== 'email' && contact.memo !== 'Phone' && contact.memo !== 'mobile' && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {contact.memo}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {customerData.customer.phoneNumber && (
                                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                                  <PhoneIcon className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium" data-testid="text-customer-phone">{formatPhoneNumber(customerData.customer.phoneNumber)}</p>
                                  </div>
                                </div>
                              )}
                              {customerData.customer.email && (
                                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                                  <Mail className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium break-all" data-testid="text-customer-email">{customerData.customer.email}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Billing Address Section */}
                        {customerData?.customer?.address && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              Billing Address
                            </h3>
                            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                              <Receipt className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {customerData.customer.address.street}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {customerData.customer.address.city}, {customerData.customer.address.state} {customerData.customer.address.zip}
                                </p>
                              </div>
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
                          // Handle 0 services case first
                          if (customerStats.serviceCount === 0 || customerStats.topPercentile === null) {
                            return (
                              <Card className="hover-elevate w-full h-full overflow-hidden cursor-pointer" data-testid="card-service-history" onClick={() => setSchedulerOpen(true)}>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full h-full relative">
                                  <Home className="w-8 h-8 text-primary mb-2" />
                                  <div className="text-base font-bold mb-1">
                                    Welcome!
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    New to Economy Plumbing
                                  </p>
                                  <Badge variant="secondary" className="text-xs mb-1">
                                    🎉 First Time Customer
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1 px-2 line-clamp-3">
                                    We're excited to serve you! Schedule your first service or call us at {phoneConfig.displayNumber} for any plumbing needs.
                                  </p>
                                  <p className="text-xs text-primary mt-2 absolute bottom-2">Get Started →</p>
                                </CardContent>
                              </Card>
                            );
                          }
                          
                          // Flip the percentile: show how many they're BETTER than (not how many are better than them)
                          const betterThanPercentile = Math.min(99, 100 - customerStats.topPercentile); // Cap at 99%
                          
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
                            message = `We're here when you need us! Remember, we offer maintenance plans, emergency services, and more. Give us a call anytime at ${phoneConfig.displayNumber}!`;
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
                    const paidInvoices = (customerData?.invoices || []).filter(inv => 
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-primary" />
                            <CardTitle>Service Locations ({customerLocations.length})</CardTitle>
                          </div>
                          <Button
                            onClick={() => setAddLocationOpen(true)}
                            size="sm"
                            variant="outline"
                            data-testid="button-add-location"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Add Location
                          </Button>
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
                            className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border"
                            data-testid={`location-card-${location.id}`}
                          >
                            <div className="flex items-start gap-3">
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
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {index === 0 && customerLocations.length > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      Primary
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLocationForContacts(location);
                                      setManageLocationContactsOpen(true);
                                    }}
                                    data-testid={`button-manage-location-contacts-${location.id}`}
                                    className="h-auto py-1 px-2 text-xs"
                                  >
                                    Manage Contacts
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Location-specific contacts */}
                            {location.contacts && location.contacts.length > 0 && (
                              <div className="pl-8 space-y-2 border-l-2 border-primary/20">
                                <p className="text-xs font-semibold text-muted-foreground">Location Contacts</p>
                                {location.contacts.map((contact: any, contactIndex: number) => {
                                  const isEmail = contact.type === 'Email';
                                  const isPhone = contact.type === 'Phone' || contact.type === 'MobilePhone';
                                  
                                  if (!isEmail && !isPhone) return null;
                                  
                                  return (
                                    <div key={contactIndex} className="flex items-start gap-2 p-2 bg-background/50 rounded text-sm">
                                      {isEmail ? (
                                        <Mail className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <PhoneIcon className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                          {contact.type === 'MobilePhone' ? 'Mobile' : contact.type}
                                          {contact.name && ` - ${contact.name}`}
                                        </p>
                                        <p className="font-medium break-all" data-testid={`location-${location.id}-contact-${contactIndex}`}>
                                          {isEmail ? contact.value : formatPhoneNumber(contact.value)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Open Estimates - Redesigned with urgency indicators */}
                  {(() => {
                    // Backend now filters for unsold estimates (where soldOn is null)
                    const openEstimates = customerData?.estimates || [];

                    if (openEstimates.length === 0) return null;

                    return (
                      <Card className="border-primary/30">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">Open Estimates</CardTitle>
                                <CardDescription className="mt-1">
                                  {openEstimates.length} {openEstimates.length === 1 ? 'estimate' : 'estimates'} awaiting your decision
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                              {openEstimates.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                            {openEstimates.map((estimate) => {
                              // Calculate urgency level
                              const isExpiringSoon = estimate.expirationStatus === 'expiring_soon';
                              const isExpired = estimate.expirationStatus === 'expired';
                              const daysLeft = estimate.daysUntilExpiration || 0;
                              
                              return (
                                <Card
                                  key={estimate.id}
                                  className={`overflow-hidden transition-all duration-200 cursor-pointer hover-elevate active-elevate-2 ${
                                    isExpiringSoon ? 'border-amber-500/50 shadow-amber-500/10 shadow-lg' : 
                                    isExpired ? 'border-destructive/50 shadow-destructive/10 shadow-lg' : 
                                    'border-primary/30'
                                  }`}
                                  onClick={() => {
                                    setSelectedEstimate(estimate);
                                    setEstimateDetailOpen(true);
                                  }}
                                  data-testid={`estimate-card-${estimate.id}`}
                                >
                                  {/* Urgency Banner */}
                                  {(isExpiringSoon || isExpired) && (
                                    <div className={`py-2 px-4 text-center text-sm font-semibold ${
                                      isExpired ? 'bg-destructive text-destructive-foreground' : 
                                      'bg-amber-500 text-white'
                                    }`}>
                                      {isExpired ? 'EXPIRED' : `EXPIRES IN ${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} - ACT NOW!`}
                                    </div>
                                  )}
                                  
                                  <CardContent className="p-6">
                                    <div className="space-y-4">
                                      {/* Header with estimate number and price */}
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold">Estimate #{estimate.estimateNumber}</h3>
                                            {getStatusBadge(estimate.status)}
                                          </div>
                                          {estimate.summary && (
                                            <p className="text-muted-foreground line-clamp-2">{estimate.summary}</p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-muted-foreground mb-1">Total</p>
                                          <p className="text-3xl font-bold text-primary">{formatCurrency(estimate.total)}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Expiration countdown */}
                                      <div className={`p-4 rounded-lg ${
                                        isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : 
                                        isExpired ? 'bg-destructive/10 border border-destructive/30' :
                                        'bg-muted/50 border'
                                      }`}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Clock className={`w-5 h-5 ${
                                              isExpiringSoon ? 'text-amber-600 dark:text-amber-500' : 
                                              isExpired ? 'text-destructive' :
                                              'text-muted-foreground'
                                            }`} />
                                            <div>
                                              <p className="text-sm font-medium">
                                                {isExpired ? 'Estimate Expired' : 'Valid Until'}
                                              </p>
                                              <p className={`text-xs ${
                                                isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : 
                                                isExpired ? 'text-destructive' :
                                                'text-muted-foreground'
                                              }`}>
                                                {estimate.expiresOn ? formatDate(estimate.expiresOn) : 'See estimate'}
                                              </p>
                                            </div>
                                          </div>
                                          {!isExpired && daysLeft > 0 && (
                                            <div className={`text-right ${
                                              isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                                            }`}>
                                              <p className="text-2xl font-bold">{daysLeft}</p>
                                              <p className="text-xs">{daysLeft === 1 ? 'day left' : 'days left'}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex gap-3 pt-2">
                                        <Button 
                                          size="lg" 
                                          className="flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEstimate(estimate);
                                            setEstimateDetailOpen(true);
                                          }}
                                          data-testid={`button-view-estimate-${estimate.id}`}
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          View Details & Accept
                                        </Button>
                                      </div>

                                      {/* Footer info */}
                                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                        <span>Created {formatDate(estimate.createdOn)}</span>
                                        <span className="flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          Click to view full details
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Recent Service Appointments - For Rating Technicians */}
                  {recentJobsData && recentJobsData.jobs.length > 0 && (
                    <Card className="border-primary/20">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-primary" />
                          <CardTitle>Recent Service Appointments</CardTitle>
                        </div>
                        <CardDescription>
                          Rate your technician and share your experience
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentJobsData.jobs.map((job) => (
                            <div
                              key={job.id}
                              className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                              data-testid={`recent-job-${job.id}`}
                            >
                              <Calendar className="w-5 h-5 text-primary mt-1" />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold">{job.serviceName || 'Service Appointment'}</h4>
                                    {job.technicianName && (
                                      <p className="text-sm text-muted-foreground">Technician: {job.technicianName}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm space-y-1">
                                  <p className="text-muted-foreground">
                                    Completed: {formatDate(job.completionDate)}
                                  </p>
                                  {job.invoiceTotal && (
                                    <p className="text-muted-foreground">
                                      Total: {formatCurrency(job.invoiceTotal / 100)}
                                    </p>
                                  )}
                                </div>

                                {/* Rating Interface */}
                                <div className="mt-3 pt-3 border-t">
                                  {job.technicianRating ? (
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-muted-foreground">Your rating:</p>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-5 h-5 ${
                                              star <= job.technicianRating!
                                                ? 'fill-primary text-primary'
                                                : 'text-muted-foreground/30'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        (Rated {formatDate(job.ratedAt!)})
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">How was your experience?</p>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            onClick={async () => {
                                              try {
                                                const response = await fetch('/api/portal/rate-technician', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    jobCompletionId: job.id,
                                                    rating: star,
                                                  }),
                                                });

                                                if (!response.ok) throw new Error('Failed to submit rating');

                                                toast({
                                                  title: 'Thank you!',
                                                  description: 'Your rating has been submitted.',
                                                });

                                                // Refresh recent jobs to show the rating
                                                await refetchRecentJobs();

                                                // Flow into review/referral or feedback based on rating
                                                if (star >= 4) {
                                                  // High rating - open review modal
                                                  setReviewModalOpen(true);
                                                  setReviewRating(0); // Reset for user to rate again in full review
                                                } else {
                                                  // Low rating - request feedback
                                                  toast({
                                                    title: 'We value your feedback',
                                                    description: 'Please let us know how we can improve.',
                                                  });
                                                  setReviewModalOpen(true);
                                                  setReviewRating(star);
                                                  setReviewFeedback("");
                                                }
                                              } catch (error) {
                                                console.error('Rating error:', error);
                                                toast({
                                                  title: 'Error',
                                                  description: 'Failed to submit rating. Please try again.',
                                                  variant: 'destructive',
                                                });
                                              }
                                            }}
                                            className="hover-elevate active-elevate-2 p-1.5 rounded transition-colors"
                                            data-testid={`button-rate-${job.id}-${star}`}
                                          >
                                            <Star className="w-6 h-6 text-muted-foreground/50 hover:text-primary hover:fill-primary transition-colors" />
                                          </button>
                                        ))}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Click a star to rate your technician
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenCancelDialog(appointment as any)}
                                      data-testid={`button-cancel-${appointment.id}`}
                                    >
                                      <AlertCircle className="w-4 h-4 mr-1" />
                                      Cancel
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
                      {(customerData?.invoices || []).length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground" data-testid="text-no-invoices">
                          No invoices found
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {(customerData?.invoices || []).map((invoice) => (
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
                                {referralsData?.referrals.length === 0 
                                  ? "Start earning rewards today! Share your link below." 
                                  : `You've referred ${referralsData?.referrals.length} ${referralsData?.referrals.length === 1 ? 'friend' : 'friends'} - thank you for spreading the word!`
                                }
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-primary">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Referral Code & Link - More Prominent */}
                        <div className="space-y-4">
                          <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary/30">
                            <p className="text-sm font-medium text-muted-foreground mb-2 text-center">Your Referral Code</p>
                            <p className="text-3xl font-bold text-primary tracking-wide text-center mb-4" data-testid="text-referral-code">
                              {referralLinkData.code}
                            </p>
                            
                            <div className="mt-4 space-y-3">
                              <Label htmlFor="referral-link" className="text-base font-semibold">Share This Link:</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="referral-link"
                                  value={referralLinkData.url}
                                  readOnly
                                  className="font-mono text-sm bg-background"
                                  data-testid="input-referral-link"
                                />
                                <Button
                                  onClick={copyReferralLink}
                                  variant={copied ? "default" : "default"}
                                  size="lg"
                                  className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                                  data-testid="button-copy-link"
                                >
                                  {copied ? (
                                    <>
                                      <Check className="w-4 h-4 mr-2" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Link
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {/* Quick Share Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  onClick={() => {
                                    const message = `Hey! I had a great experience with Economy Plumbing Services. Save $25 on your first service using my referral link: ${referralLinkData.url}\n\nThey're awesome! Call them at ${phoneConfig.display}`;
                                    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  data-testid="button-share-sms"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Share via Text
                                </Button>
                                <Button
                                  onClick={() => {
                                    const subject = "Save $25 on Plumbing Services";
                                    const body = `Hi!\n\nI wanted to share this with you - I recently used Economy Plumbing Services and they were fantastic!\n\nYou can save $25 on your first service using my referral link:\n${referralLinkData.url}\n\nThey're professional, reliable, and their work is top-notch. Give them a call at ${phoneConfig.display} if you need any plumbing work done.\n\nBest regards`;
                                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  data-testid="button-share-email"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Share via Email
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Sharing Tips */}
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Share2 className="w-4 h-4" />
                              Great Places to Share Your Link:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                              <li>• <strong>Facebook</strong> - Post on your timeline or in local community groups</li>
                              <li>• <strong>Instagram</strong> - Add to your bio or Stories</li>
                              <li>• <strong>Nextdoor</strong> - Share with your neighbors</li>
                              <li>• <strong>Text Messages</strong> - Send directly to friends and family</li>
                              <li>• <strong>Email</strong> - Include in your email signature</li>
                            </ul>
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
                        {referralsData && referralsData.referrals.length > 0 ? (
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
                        ) : (
                          referralsData && (
                            <div className="p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg border border-primary/20 text-center space-y-4">
                              <div className="flex justify-center">
                                <Gift className="w-12 h-12 text-primary animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-lg">Be the First to Start Earning!</h4>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                  You haven't made any referrals yet, but there's great potential waiting! 
                                  Copy your link above and share it to start earning $25 rewards.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  It's simple: they save $25, you earn $25. Everyone wins!
                                </p>
                              </div>
                            </div>
                          )
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

                        {/* Quick Refer Button */}
                        <Button
                          onClick={() => setShowReferralModal(true)}
                          className="w-full"
                          size="lg"
                          data-testid="button-share-referral"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Refer Someone New
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  </div>

                  {/* Vouchers Section */}
                  {customerId && <VouchersSection customerId={parseInt(customerId)} />}

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
                          className="w-full"
                          size="lg"
                          data-testid="button-leave-review"
                          onClick={() => {
                            setReviewRating(0);
                            setReviewFeedback("");
                            setReviewModalOpen(true);
                          }}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave a Review
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
      
      {/* Schedule Appointment Dialog */}
      {customerData && (() => {
        // Debug: Log all locations to console
        console.log('[Portal Debug] All customer locations:', customerLocations);
        
        // CRITICAL: ALWAYS prefer non-Hill Country (78654) locations for scheduling
        // Hill Country is billing address, not service location
        const serviceLocation = customerLocations.find(loc => loc.address?.zip !== '78654') || customerLocations[0];
          
        console.log('[Portal Debug] Selected service location:', serviceLocation);
        console.log('[Portal Debug] Using ZIP for scheduler (service location ONLY):', serviceLocation?.address?.zip || 'NO LOCATION AVAILABLE');
        
        return (
          <SchedulerDialog
            open={schedulerOpen}
            onOpenChange={setSchedulerOpen}
            customerInfo={{
              firstName: customerData.customer.name.split(' ')[0] || '',
              lastName: customerData.customer.name.split(' ').slice(1).join(' ') || '',
              email: customerData.customer.email || '',
              phone: customerData.customer.phoneNumber || '',
              // CRITICAL: Use ONLY service location data, NEVER billing address for scheduling
              address: serviceLocation?.address?.street || '',
              city: serviceLocation?.address?.city || '',
              state: serviceLocation?.address?.state || '',
              zip: serviceLocation?.address?.zip || '',
              serviceTitanId: customerData.customer.id,
              customerTags: customerData.customer.customerTags || [],
              locationId: serviceLocation?.id,
            }}
            locations={customerLocations}
            utmSource="customer-portal"
          />
        );
      })()}
      
      {/* Referral Modal */}
      {customerData && referralLinkData && (
        <ReferralModal
          open={showReferralModal}
          onOpenChange={setShowReferralModal}
          customerName={customerData.customer.name}
          customerPhone={formatPhoneNumber(customerData.customer.phoneNumber)}
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Estimate #{selectedEstimate.estimateNumber}</h3>
                    {selectedEstimate.summary && (
                      <p className="text-sm text-muted-foreground">{selectedEstimate.summary}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(selectedEstimate.status)}
                    {getExpirationBadge(selectedEstimate)}
                  </div>
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
                              {item.pricebookDetails?.name || item.sku?.name || 'Service Item'}
                            </p>
                            {item.description && (
                              <div 
                                className="text-sm text-muted-foreground mt-1"
                                dangerouslySetInnerHTML={{ __html: item.description }}
                              />
                            )}
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Quantity:
                                </span>
                                <span>{item.quantity || item.qty || 1}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Unit Price:
                                </span>
                                <span>{formatCurrency(item.unitRate || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t">
                                <span className="font-medium">
                                  Line Total:
                                </span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(item.total || 0)}
                                </span>
                              </div>
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
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShowAcceptanceDialog(true);
                  }}
                  data-testid="button-accept-estimate"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept This Estimate
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEstimateDetailOpen(false)}
                    data-testid="button-close-estimate-detail"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
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
                    Request PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Estimate Acceptance Confirmation Dialog */}
      <Dialog open={showAcceptanceDialog} onOpenChange={setShowAcceptanceDialog}>
        <DialogContent className="max-w-lg" data-testid="dialog-accept-estimate-confirmation">
          <DialogHeader>
            <DialogTitle>Accept This Estimate?</DialogTitle>
            <DialogDescription>
              Please review the estimate details and terms before accepting
            </DialogDescription>
          </DialogHeader>

          {selectedEstimate && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <h3 className="font-semibold mb-2">Estimate #{selectedEstimate.estimateNumber}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold text-primary text-lg">{formatCurrency(selectedEstimate.total)}</span>
                  </div>
                  {selectedEstimate.summary && (
                    <p className="text-muted-foreground mt-2">{selectedEstimate.summary}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/20 rounded-lg border">
                  <h4 className="font-semibold mb-2">What Happens Next:</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>Our scheduling team will contact you within 1 business day</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>We'll find a convenient time for the service</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>You'll receive a confirmation with appointment details</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={acceptanceTermsAgreed}
                    onChange={(e) => setAcceptanceTermsAgreed(e.target.checked)}
                    className="mt-1"
                    data-testid="checkbox-accept-terms"
                  />
                  <label htmlFor="accept-terms" className="text-sm cursor-pointer">
                    I understand that by accepting this estimate, I am agreeing to have Economy Plumbing Services 
                    perform the work described above at the quoted price. This is not a binding contract for scheduling, 
                    but confirms my intent to proceed with the service.
                  </label>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAcceptanceDialog(false);
                    setAcceptanceTermsAgreed(false);
                  }}
                  disabled={isAcceptingEstimate}
                  data-testid="button-cancel-acceptance"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!acceptanceTermsAgreed) {
                      toast({
                        title: 'Please agree to terms',
                        description: 'You must agree to the terms before accepting the estimate',
                        variant: 'destructive',
                      });
                      return;
                    }

                    setIsAcceptingEstimate(true);
                    try {
                      const response = await fetch('/api/portal/accept-estimate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          estimateId: selectedEstimate.id,
                          estimateNumber: selectedEstimate.estimateNumber,
                        }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to accept estimate');
                      }

                      toast({
                        title: 'Estimate Accepted!',
                        description: data.message || 'Our team will contact you soon to schedule the work.',
                      });

                      setShowAcceptanceDialog(false);
                      setEstimateDetailOpen(false);
                      setAcceptanceTermsAgreed(false);

                      // Refresh customer data to remove accepted estimate from list
                      await queryClient.invalidateQueries({ 
                        queryKey: ['/api/servicetitan/customer', customerId] 
                      });

                    } catch (error: any) {
                      console.error('Estimate acceptance error:', error);
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to accept estimate. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsAcceptingEstimate(false);
                    }
                  }}
                  disabled={!acceptanceTermsAgreed || isAcceptingEstimate}
                  data-testid="button-confirm-acceptance"
                >
                  {isAcceptingEstimate ? 'Accepting...' : 'Accept Estimate'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent data-testid="dialog-cancel">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment?
            </DialogDescription>
          </DialogHeader>
          
          {appointmentToCancel && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm"><strong>Service:</strong> {appointmentToCancel.jobType}</p>
                <p className="text-sm"><strong>Date:</strong> {formatDate(appointmentToCancel.start)}</p>
                {appointmentToCancel.arrivalWindowStart && appointmentToCancel.arrivalWindowEnd && (
                  <p className="text-sm">
                    <strong>Time:</strong> {formatTime(appointmentToCancel.arrivalWindowStart)} - {formatTime(appointmentToCancel.arrivalWindowEnd)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for Cancellation (Optional)</Label>
                <Input
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, no longer needed..."
                  data-testid="input-cancel-reason"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Note: Once canceled, you'll need to schedule a new appointment if you change your mind. You can also call us at {phoneConfig.display} if you need assistance.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCanceling}
              data-testid="button-keep-appointment"
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={isCanceling}
              data-testid="button-confirm-cancel"
            >
              {isCanceling ? "Canceling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
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
                  <Label htmlFor="new-window">Available Time Slots</Label>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <p className="text-sm text-muted-foreground">Loading available times...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <Select
                      value={newAppointmentWindow}
                      onValueChange={setNewAppointmentWindow}
                    >
                      <SelectTrigger id="new-window" data-testid="select-time-window">
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem 
                            key={slot.id} 
                            value={slot.id}
                            data-testid={`option-${slot.id}`}
                          >
                            {slot.timeLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : newAppointmentDate ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <p className="text-sm text-muted-foreground">No available time slots for this date. Try another date.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <p className="text-sm text-muted-foreground">Select a date to see available times.</p>
                    </div>
                  )}
                </div>
              </div>

              {availableSlots.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing most fuel-efficient time slots based on your location. This helps us minimize driving and serve you better!
                </p>
              )}
              
              {/* Special Instructions field (always shown) */}
              <div className="space-y-2">
                <Label htmlFor="reschedule-special-instructions">Special Instructions (Optional)</Label>
                <Input
                  id="reschedule-special-instructions"
                  value={rescheduleSpecialInstructions}
                  onChange={(e) => setRescheduleSpecialInstructions(e.target.value)}
                  placeholder="Gate code, door code, parking instructions, etc."
                  data-testid="input-reschedule-special-instructions"
                />
                <p className="text-xs text-muted-foreground">
                  Any gate codes, door codes, or special access instructions for our technician
                </p>
              </div>

              {/* Groupon Voucher field (conditional - only for Groupon services) */}
              {appointmentToReschedule?.jobType?.toLowerCase().includes('groupon') || 
               appointmentToReschedule?.jobType?.toLowerCase().includes('$49') ? (
                <div className="space-y-2">
                  <Label htmlFor="reschedule-groupon-voucher">Groupon Voucher Code (Optional)</Label>
                  <Input
                    id="reschedule-groupon-voucher"
                    value={rescheduleGrouponVoucher}
                    onChange={(e) => setRescheduleGrouponVoucher(e.target.value)}
                    placeholder="Enter your Groupon voucher code"
                    data-testid="input-reschedule-groupon-voucher"
                  />
                </div>
              ) : null}
              
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

      {/* Email Us Dialog */}
      <Dialog open={emailUsOpen} onOpenChange={setEmailUsOpen}>
        <DialogContent data-testid="dialog-email-us">
          <DialogHeader>
            <DialogTitle>Email Us</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-name">Name</Label>
                <Input
                  id="email-name"
                  type="text"
                  value={emailUsName}
                  onChange={(e) => setEmailUsName(e.target.value)}
                  placeholder="Your Name"
                  data-testid="input-email-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-phone">Phone</Label>
                <Input
                  id="email-phone"
                  type="tel"
                  value={emailUsPhone}
                  onChange={(e) => setEmailUsPhone(e.target.value)}
                  placeholder="(512) 123-4567"
                  data-testid="input-email-phone"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-address">Email Address</Label>
              <Input
                id="email-address"
                type="email"
                value={emailUsEmail}
                onChange={(e) => setEmailUsEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="input-email-address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                type="text"
                value={emailUsSubject}
                onChange={(e) => setEmailUsSubject(e.target.value)}
                placeholder="How can we help?"
                data-testid="input-email-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <textarea
                id="email-message"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={emailUsMessage}
                onChange={(e) => setEmailUsMessage(e.target.value)}
                placeholder="Tell us more about what you need..."
                data-testid="input-email-message"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailUsOpen(false)}
              disabled={isSendingEmail}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!emailUsName || !emailUsEmail || !emailUsMessage) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in all required fields",
                    variant: "destructive"
                  });
                  return;
                }
                
                setIsSendingEmail(true);
                try {
                  const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: emailUsName,
                      email: emailUsEmail,
                      phone: emailUsPhone,
                      subject: emailUsSubject || "Customer Portal Inquiry",
                      message: emailUsMessage,
                      source: "customer_portal"
                    }),
                  });

                  if (response.ok) {
                    toast({
                      title: "Message Sent!",
                      description: "We've received your message and will respond soon.",
                    });
                    setEmailUsOpen(false);
                    // Clear form
                    setEmailUsSubject("");
                    setEmailUsMessage("");
                  } else {
                    throw new Error("Failed to send message");
                  }
                } catch (error) {
                  console.error("Error sending email:", error);
                  toast({
                    title: "Error",
                    description: "Failed to send message. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsSendingEmail(false);
                }
              }}
              disabled={isSendingEmail || !emailUsName || !emailUsEmail || !emailUsMessage}
              data-testid="button-send-email"
            >
              {isSendingEmail ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Collection Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewRating === 0 ? "How was your experience?" : 
               reviewRating >= 4 ? "Thank you for your feedback!" : 
               "We appreciate your feedback"}
            </DialogTitle>
            <DialogDescription>
              {reviewRating === 0 ? "Please rate your recent service" : 
               reviewRating >= 4 ? "Share your positive experience with others" : 
               "Help us improve our service"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= reviewRating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating-based content */}
            {reviewRating > 0 && (
              <>
                {reviewRating >= 4 ? (
                  // Positive review - show platform links
                  <div className="space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      Please share your experience on one of these platforms:
                    </p>
                    
                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          window.open('https://g.page/r/CeBZvF4LQ-KNEAE/review', '_blank');
                          setReviewModalOpen(false);
                          toast({
                            title: "Thank you!",
                            description: "Opening Google Reviews...",
                          });
                        }}
                        data-testid="button-google-review"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Reviews
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          window.open('https://www.facebook.com/EconomyPlumbingServices/reviews', '_blank');
                          setReviewModalOpen(false);
                          toast({
                            title: "Thank you!",
                            description: "Opening Facebook Reviews...",
                          });
                        }}
                        data-testid="button-facebook-review"
                      >
                        <SiFacebook className="w-5 h-5 text-[#1877F2]" />
                        Facebook Reviews
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          window.open('https://www.yelp.com/writeareview/biz/economy-plumbing-services-austin', '_blank');
                          setReviewModalOpen(false);
                          toast({
                            title: "Thank you!",
                            description: "Opening Yelp Reviews...",
                          });
                        }}
                        data-testid="button-yelp-review"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#FF1A1A" d="M12.062 17.662c.038-.934-.008-.889.002-2.393.007-.9.527-.991.756-.635.052.081 1.518 2.368 1.541 2.449.156.557-.194.683-.774.619-.651-.072-1.245-.166-1.249-.166-.265-.049-.368-.146-.276-.51zm2.167-4.142c.011-.908.012-.908.021-1.823.011-1.103-.746-1.098-1.069-.501-.073.135-1.164 2.443-1.212 2.553-.175.408.254.578.663.556l1.27-.069c.17-.009.333-.065.327-.716zm-3.192.955c.901-.111.91-.148 1.75-.291.508-.087.546-.567.087-.752-.105-.042-2.634-.912-2.728-.951-.599-.247-.772.292-.548.867.251.646.497 1.222.497 1.227.103.224.256.215.585-.065zm-3.834 5.558c.347-.778.347-.801.651-1.479.365-.815-.397-1.139-.856-.595-.099.125-1.912 2.317-1.939 2.383-.231.576.271.876.687.803.682-.125 1.162-.239 1.166-.244.178-.108.24-.243.291-.868zm.901-2.701c.793-.448.808-.457 1.522-.874.86-.502.429-1.155-.342-1.176-.177-.005-3.057-.029-3.163-.036-.671-.043-.819.503-.438.929.427.478.823.912.827.917.163.175.36.14.698-.09z"/>
                        </svg>
                        Yelp Reviews
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          window.open('https://www.bbb.org/us/tx/austin/profile/plumber/economy-plumbing-services-0825-1000049576/customer-reviews', '_blank');
                          setReviewModalOpen(false);
                          toast({
                            title: "Thank you!",
                            description: "Opening BBB Reviews...",
                          });
                        }}
                        data-testid="button-bbb-review"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#003087" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                        BBB Reviews
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Negative review - collect private feedback
                  <div className="space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      We're sorry to hear about your experience. Please tell us how we can improve:
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="feedback">Your Feedback</Label>
                      <textarea
                        id="feedback"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        placeholder="Please share what went wrong and how we can do better..."
                        data-testid="input-review-feedback"
                      />
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={async () => {
                        setIsSubmittingReview(true);
                        try {
                          // Submit private feedback
                          const response = await fetch("/api/reviews/private-feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customerId: customerId,
                              rating: reviewRating,
                              feedback: reviewFeedback,
                              customerName: customerData?.customer?.name || "Anonymous",
                              customerEmail: customerData?.customer?.email || ""
                            }),
                          });

                          if (response.ok) {
                            toast({
                              title: "Thank you for your feedback",
                              description: "We'll review your comments and work to improve our service.",
                            });
                            setReviewModalOpen(false);
                          } else {
                            throw new Error("Failed to submit feedback");
                          }
                        } catch (error) {
                          console.error("Error submitting feedback:", error);
                          toast({
                            title: "Error",
                            description: "Failed to submit feedback. Please try again.",
                            variant: "destructive"
                          });
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      disabled={isSubmittingReview || !reviewFeedback.trim()}
                      data-testid="button-submit-feedback"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {reviewRating === 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewModalOpen(false)}
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
        <DialogContent data-testid="dialog-add-location">
          <DialogHeader>
            <DialogTitle>Add New Service Location</DialogTitle>
            <DialogDescription>
              Add a new address where you need plumbing services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-address">Street Address *</Label>
              <Input
                id="new-address"
                value={newLocationData.address}
                onChange={(e) => setNewLocationData({ ...newLocationData, address: e.target.value })}
                placeholder="123 Main St"
                data-testid="input-new-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-city">City *</Label>
                <Input
                  id="new-city"
                  value={newLocationData.city}
                  onChange={(e) => setNewLocationData({ ...newLocationData, city: e.target.value })}
                  placeholder="Austin"
                  data-testid="input-new-city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-state">State *</Label>
                <Select
                  value={newLocationData.state}
                  onValueChange={(value) => setNewLocationData({ ...newLocationData, state: value })}
                >
                  <SelectTrigger id="new-state" data-testid="select-new-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-zip">ZIP Code *</Label>
              <Input
                id="new-zip"
                value={newLocationData.zipCode}
                onChange={(e) => setNewLocationData({ ...newLocationData, zipCode: e.target.value })}
                placeholder="78701"
                maxLength={5}
                data-testid="input-new-zip"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-special-instructions">Special Instructions (Optional)</Label>
              <Input
                id="new-special-instructions"
                value={newLocationData.specialInstructions}
                onChange={(e) => setNewLocationData({ ...newLocationData, specialInstructions: e.target.value })}
                placeholder="Gate code, door code, parking instructions, etc."
                data-testid="input-new-special-instructions"
              />
              <p className="text-xs text-muted-foreground">
                This will be securely stored for technician access
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddLocationOpen(false);
                setNewLocationData({
                  address: '',
                  city: 'Austin',
                  state: 'TX',
                  zipCode: '',
                  specialInstructions: '',
                });
              }}
              disabled={isAddingLocation}
              data-testid="button-cancel-add-location"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={isAddingLocation || !newLocationData.address || !newLocationData.zipCode}
              data-testid="button-submit-add-location"
            >
              {isAddingLocation ? 'Adding...' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent data-testid="dialog-add-contact">
          <DialogHeader>
            <DialogTitle>Add Contact Information</DialogTitle>
            <DialogDescription>
              Add a new phone number or email address to your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-type">Contact Type *</Label>
              <Select
                value={newContactType}
                onValueChange={(value: any) => setNewContactType(value)}
              >
                <SelectTrigger id="contact-type" data-testid="select-contact-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="MobilePhone">Mobile Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-value">
                {newContactType === 'Email' ? 'Email Address' : 'Phone Number'} *
              </Label>
              <Input
                id="contact-value"
                type={newContactType === 'Email' ? 'email' : 'tel'}
                value={newContactValue}
                onChange={(e) => setNewContactValue(e.target.value)}
                placeholder={newContactType === 'Email' ? 'you@example.com' : '(512) 555-1234'}
                data-testid="input-contact-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-memo">Label (Optional)</Label>
              <Input
                id="contact-memo"
                value={newContactMemo}
                onChange={(e) => setNewContactMemo(e.target.value)}
                placeholder="e.g., Work, Home, Personal"
                data-testid="input-contact-memo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddContactOpen(false);
                setNewContactValue("");
                setNewContactMemo("");
              }}
              disabled={isAddingContact}
              data-testid="button-cancel-add-contact"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!customerId || !newContactValue.trim()) return;
                
                setIsAddingContact(true);
                try {
                  const response = await fetch('/api/portal/customer-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customerId,
                      type: newContactType,
                      value: newContactValue.trim(),
                      memo: newContactMemo.trim() || undefined
                    }),
                  });

                  if (!response.ok) throw new Error('Failed to add contact');

                  toast({
                    title: 'Contact added',
                    description: 'Your contact information has been updated.',
                  });

                  setAddContactOpen(false);
                  setNewContactValue("");
                  setNewContactMemo("");
                  
                  queryClient.invalidateQueries({ queryKey: ['/api/servicetitan/customer', customerId] });
                } catch (error) {
                  console.error('Add contact error:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to add contact. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsAddingContact(false);
                }
              }}
              disabled={isAddingContact || !newContactValue.trim()}
              data-testid="button-submit-add-contact"
            >
              {isAddingContact ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Location Contacts Dialog */}
      <Dialog open={manageLocationContactsOpen} onOpenChange={setManageLocationContactsOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-manage-location-contacts">
          <DialogHeader>
            <DialogTitle>Manage Location Contacts</DialogTitle>
            <DialogDescription>
              {selectedLocationForContacts?.name || 'Location'} - Add or manage contacts specific to this location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Existing contacts */}
            {selectedLocationForContacts?.contacts && selectedLocationForContacts.contacts.length > 0 && (
              <div className="space-y-2">
                <Label>Current Contacts</Label>
                {selectedLocationForContacts.contacts.map((contact: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    {contact.type === 'Email' ? (
                      <Mail className="w-4 h-4 text-primary" />
                    ) : (
                      <PhoneIcon className="w-4 h-4 text-primary" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contact.type === 'Email' ? contact.value : formatPhoneNumber(contact.value)}</p>
                      {contact.name && <p className="text-xs text-muted-foreground">{contact.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new contact form */}
            <div className="border-t pt-4">
              <Label className="mb-3 block">Add New Contact</Label>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="loc-contact-type">Type</Label>
                  <Select
                    value={newLocationContactType}
                    onValueChange={(value: any) => setNewLocationContactType(value)}
                  >
                    <SelectTrigger id="loc-contact-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="MobilePhone">Mobile Phone</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loc-contact-name">Contact Name (Optional)</Label>
                  <Input
                    id="loc-contact-name"
                    value={newLocationContactName}
                    onChange={(e) => setNewLocationContactName(e.target.value)}
                    placeholder="e.g., Property Manager, Office Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loc-contact-value">
                    {newLocationContactType === 'Email' ? 'Email' : 'Phone Number'}
                  </Label>
                  <Input
                    id="loc-contact-value"
                    type={newLocationContactType === 'Email' ? 'email' : 'tel'}
                    value={newLocationContactValue}
                    onChange={(e) => setNewLocationContactValue(e.target.value)}
                    placeholder={newLocationContactType === 'Email' ? 'contact@example.com' : '(512) 555-1234'}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageLocationContactsOpen(false);
                setSelectedLocationForContacts(null);
                setNewLocationContactValue("");
                setNewLocationContactName("");
                setNewLocationContactMemo("");
              }}
              disabled={isAddingLocationContact}
            >
              Close
            </Button>
            <Button
              onClick={async () => {
                if (!customerId || !selectedLocationForContacts || !newLocationContactValue.trim()) return;
                
                setIsAddingLocationContact(true);
                try {
                  const response = await fetch('/api/portal/location-contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customerId,
                      locationId: selectedLocationForContacts.id,
                      type: newLocationContactType,
                      value: newLocationContactValue.trim(),
                      name: newLocationContactName.trim() || undefined,
                      memo: newLocationContactMemo.trim() || undefined
                    }),
                  });

                  if (!response.ok) throw new Error('Failed to add location contact');

                  toast({
                    title: 'Contact added',
                    description: 'Location contact has been added successfully.',
                  });

                  setNewLocationContactValue("");
                  setNewLocationContactName("");
                  setNewLocationContactMemo("");
                  
                  queryClient.invalidateQueries({ queryKey: ['/api/portal/customer-locations', customerId] });
                } catch (error) {
                  console.error('Add location contact error:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to add location contact. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsAddingLocationContact(false);
                }
              }}
              disabled={isAddingLocationContact || !newLocationContactValue.trim()}
            >
              {isAddingLocationContact ? 'Adding...' : 'Add Contact'}
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
