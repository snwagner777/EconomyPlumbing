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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openScheduler } from "@/lib/scheduler";
import type { PhoneConfig } from "@/server/lib/phoneNumbers";
import { ReferralModal } from "@/components/ReferralModal";
import { VouchersSection } from "./VouchersSection";
import { CustomerPortalAuth } from "./components/auth/CustomerPortalAuth";
import { AuthenticatedPortal } from "./AuthenticatedPortal";
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
import { SchedulerDialog } from "@/modules/scheduler";
import { ContactForm, useAddCustomerContact, useAddLocationContact } from "@/modules/contacts";

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
  locationId?: number;
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
  locationId?: number;
  expirationStatus?: string;
  daysUntilExpiration?: number;
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
  // Auth state - only what's needed post-authentication
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [availableCustomerIds, setAvailableCustomerIds] = useState<number[]>([]);
  
  // Tab state for accounts and locations
  const [activeAccountTab, setActiveAccountTab] = useState<string>("");
  const [activeLocationTab, setActiveLocationTab] = useState<string>("");
  
  // UI state
  const [copied, setCopied] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [isLoadingSwitcher, setIsLoadingSwitcher] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<CustomerAccount[]>([]);
  
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
  const [schedulerEstimateId, setSchedulerEstimateId] = useState<number | null>(null);
  const [schedulerSoldHours, setSchedulerSoldHours] = useState<number>(0);
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
  
  // Contact dialogs state (forms managed by ContactForm component)
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [manageLocationContactsOpen, setManageLocationContactsOpen] = useState(false);
  const [selectedLocationForContacts, setSelectedLocationForContacts] = useState<any>(null);
  
  const { toast } = useToast();
  
  // Contact mutation hooks
  const addCustomerContact = useAddCustomerContact();
  const addLocationContact = useAddLocationContact();

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
      contacts?: any[];
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

  // Fetch account summaries for ALL available customer IDs
  const { data: accountSummariesData } = useQuery<{
    accounts: Array<{
      id: number;
      name: string;
      type: string;
      email: string | null;
      phoneNumber: string | null;
      locationCount: number;
      primaryLocationId: number | null;
    }>;
  }>({
    queryKey: ['/api/portal/customer-accounts', availableCustomerIds],
    enabled: availableCustomerIds.length > 0,
    queryFn: async () => {
      const response = await fetch('/api/portal/customer-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds: availableCustomerIds }),
      });
      if (!response.ok) throw new Error('Failed to fetch account summaries');
      return response.json();
    },
  });

  const timeWindows = arrivalWindowsData?.windows || [];
  const customerLocations = locationsData?.locations || [];
  const accountSummaries = accountSummariesData?.accounts || [];

  // Separate upcoming and completed appointments
  // Filter by location - backend now enriches appointments with locationId from jobs
  const upcomingAppointments = (customerData?.appointments || []).filter(apt => {
    const isUpcoming = new Date(apt.start) > new Date();
    const isNotCompleted = !['Done', 'Completed', 'Cancelled'].includes(apt.status);
    const matchesLocation = !activeLocationTab || apt.locationId?.toString() === activeLocationTab;
    return isUpcoming && isNotCompleted && matchesLocation;
  });

  const completedAppointments = (customerData?.appointments || []).filter(apt => {
    const isPast = new Date(apt.start) <= new Date();
    const isCompleted = ['Done', 'Completed', 'Cancelled'].includes(apt.status);
    const matchesLocation = !activeLocationTab || apt.locationId?.toString() === activeLocationTab;
    return (isPast || isCompleted) && matchesLocation;
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

  // Initialize active tabs when customer ID or locations change
  useEffect(() => {
    if (customerId && !activeAccountTab) {
      setActiveAccountTab(customerId);
    }
  }, [customerId, activeAccountTab]);

  useEffect(() => {
    if (customerLocations.length > 0 && !activeLocationTab) {
      setActiveLocationTab(customerLocations[0].id.toString());
    }
  }, [customerLocations, activeLocationTab]);

  // POST-AUTH account switching only (initial auth handled by CustomerPortalAuth)
  const handleSelectAccount = async (accountId: number) => {
    try {
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
    } catch (error: any) {
      console.error('Account switch error:', error);
      toast({
        title: "Error",
        description: "Failed to switch account. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Failed to load account details",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSwitcher(false);
      }
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

      // Clear state
      setCustomerId(null);
      setAvailableCustomerIds([]);
      
      // Clear ALL queries to prevent data leakage between sessions
      queryClient.clear();
      
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
          phone: customerData?.customer?.phoneNumber || customerData?.customer?.email || '',
          email: customerData?.customer?.email,
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
        isPortalAuthenticated={!!customerId} 
        onPortalLogout={handleLogout} 
      />

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {customerId && customerData ? (() => {
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
              {customerId ? 
                'Your service history, appointments, and account details' :
                'Access your service history, appointments, and invoices'
              }
            </p>
          </div>

          {!customerId ? (
            <CustomerPortalAuth
              onAuthenticated={(id, ids) => {
                setCustomerId(id);
                setAvailableCustomerIds(ids);
              }}
              onError={(message) =>
                toast({ title: "Authentication failed", description: message, variant: "destructive" })
              }
            />
          ) : (
            <AuthenticatedPortal
              customerId={customerId}
              availableCustomerIds={availableCustomerIds}
              customerData={customerData}
              isLoading={isLoading}
              error={error}
              phoneConfig={phoneConfig}
              marbleFallsPhoneConfig={marbleFallsPhoneConfig}
              toast={toast}
              referralsData={referralsData}
              referralLinkData={referralLinkData}
              customerStats={customerStats}
              recentJobsData={recentJobsData}
              locationsData={locationsData}
              emailHistoryData={emailHistoryData}
              accountSummariesData={accountSummariesData}
              arrivalWindowsData={arrivalWindowsData}
              timeWindows={timeWindows}
              customerLocations={customerLocations}
              accountSummaries={accountSummaries}
              upcomingAppointments={upcomingAppointments}
              completedAppointments={completedAppointments}
              activeAccountTab={activeAccountTab}
              setActiveAccountTab={setActiveAccountTab}
              activeLocationTab={activeLocationTab}
              setActiveLocationTab={setActiveLocationTab}
              copied={copied}
              setCopied={setCopied}
              showReferralModal={showReferralModal}
              setShowReferralModal={setShowReferralModal}
              showAccountSelection={showAccountSelection}
              setShowAccountSelection={setShowAccountSelection}
              isLoadingSwitcher={isLoadingSwitcher}
              setIsLoadingSwitcher={setIsLoadingSwitcher}
              availableAccounts={availableAccounts}
              setAvailableAccounts={setAvailableAccounts}
              rescheduleDialogOpen={rescheduleDialogOpen}
              setRescheduleDialogOpen={setRescheduleDialogOpen}
              appointmentToReschedule={appointmentToReschedule}
              setAppointmentToReschedule={setAppointmentToReschedule}
              newAppointmentDate={newAppointmentDate}
              setNewAppointmentDate={setNewAppointmentDate}
              newAppointmentWindow={newAppointmentWindow}
              setNewAppointmentWindow={setNewAppointmentWindow}
              rescheduleSpecialInstructions={rescheduleSpecialInstructions}
              setRescheduleSpecialInstructions={setRescheduleSpecialInstructions}
              rescheduleGrouponVoucher={rescheduleGrouponVoucher}
              setRescheduleGrouponVoucher={setRescheduleGrouponVoucher}
              isRescheduling={isRescheduling}
              setIsRescheduling={setIsRescheduling}
              availableSlots={availableSlots}
              setAvailableSlots={setAvailableSlots}
              isLoadingSlots={isLoadingSlots}
              cancelDialogOpen={cancelDialogOpen}
              setCancelDialogOpen={setCancelDialogOpen}
              appointmentToCancel={appointmentToCancel}
              setAppointmentToCancel={setAppointmentToCancel}
              cancelReason={cancelReason}
              setCancelReason={setCancelReason}
              isCanceling={isCanceling}
              setIsCanceling={setIsCanceling}
              editContactsOpen={editContactsOpen}
              setEditContactsOpen={setEditContactsOpen}
              editEmail={editEmail}
              setEditEmail={setEditEmail}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              isUpdatingContacts={isUpdatingContacts}
              deleteContactDialogOpen={deleteContactDialogOpen}
              setDeleteContactDialogOpen={setDeleteContactDialogOpen}
              contactToDelete={contactToDelete}
              setContactToDelete={setContactToDelete}
              isDeletingContact={isDeletingContact}
              editAddressOpen={editAddressOpen}
              setEditAddressOpen={setEditAddressOpen}
              editStreet={editStreet}
              setEditStreet={setEditStreet}
              editCity={editCity}
              setEditCity={setEditCity}
              editState={editState}
              setEditState={setEditState}
              editZip={editZip}
              setEditZip={setEditZip}
              isUpdatingAddress={isUpdatingAddress}
              locationId={locationId}
              emailUsOpen={emailUsOpen}
              setEmailUsOpen={setEmailUsOpen}
              emailUsSubject={emailUsSubject}
              setEmailUsSubject={setEmailUsSubject}
              emailUsMessage={emailUsMessage}
              setEmailUsMessage={setEmailUsMessage}
              emailUsName={emailUsName}
              setEmailUsName={setEmailUsName}
              emailUsEmail={emailUsEmail}
              setEmailUsEmail={setEmailUsEmail}
              emailUsPhone={emailUsPhone}
              setEmailUsPhone={setEmailUsPhone}
              isSendingEmail={isSendingEmail}
              reviewModalOpen={reviewModalOpen}
              setReviewModalOpen={setReviewModalOpen}
              reviewRating={reviewRating}
              setReviewRating={setReviewRating}
              reviewFeedback={reviewFeedback}
              setReviewFeedback={setReviewFeedback}
              isSubmittingReview={isSubmittingReview}
              schedulerOpen={schedulerOpen}
              setSchedulerOpen={setSchedulerOpen}
              schedulerEstimateId={schedulerEstimateId}
              setSchedulerEstimateId={setSchedulerEstimateId}
              schedulerSoldHours={schedulerSoldHours}
              setSchedulerSoldHours={setSchedulerSoldHours}
              estimateDetailOpen={estimateDetailOpen}
              setEstimateDetailOpen={setEstimateDetailOpen}
              selectedEstimate={selectedEstimate}
              setSelectedEstimate={setSelectedEstimate}
              showAcceptanceDialog={showAcceptanceDialog}
              setShowAcceptanceDialog={setShowAcceptanceDialog}
              isAcceptingEstimate={isAcceptingEstimate}
              acceptanceTermsAgreed={acceptanceTermsAgreed}
              setAcceptanceTermsAgreed={setAcceptanceTermsAgreed}
              addLocationOpen={addLocationOpen}
              setAddLocationOpen={setAddLocationOpen}
              newLocationData={newLocationData}
              setNewLocationData={setNewLocationData}
              isAddingLocation={isAddingLocation}
              addContactOpen={addContactOpen}
              setAddContactOpen={setAddContactOpen}
              manageLocationContactsOpen={manageLocationContactsOpen}
              setManageLocationContactsOpen={setManageLocationContactsOpen}
              selectedLocationForContacts={selectedLocationForContacts}
              setSelectedLocationForContacts={setSelectedLocationForContacts}
              addCustomerContact={addCustomerContact}
              addLocationContact={addLocationContact}
              refetchRecentJobs={refetchRecentJobs}
              handleSelectAccount={handleSelectAccount}
              handleSwitchAccount={handleSwitchAccount}
              handleOpenRescheduleDialog={handleOpenRescheduleDialog}
              handleRescheduleAppointment={handleRescheduleAppointment}
              handleOpenCancelDialog={handleOpenCancelDialog}
              handleCancelAppointment={handleCancelAppointment}
              handleEditContacts={handleEditContacts}
              handleUpdateContacts={handleUpdateContacts}
              handleDeleteContact={handleDeleteContact}
              handleEditAddress={handleEditAddress}
              handleUpdateAddress={handleUpdateAddress}
              handleAddLocation={handleAddLocation}
              handleRequestPDF={handleRequestPDF}
              fetchCustomerLocation={fetchCustomerLocation}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              formatTime={formatTime}
              copyReferralLink={copyReferralLink}
              shareViaFacebook={shareViaFacebook}
              shareViaX={shareViaX}
              shareViaEmail={shareViaEmail}
              shareViaSMS={shareViaSMS}
              getStatusBadge={getStatusBadge}
              getExpirationBadge={getExpirationBadge}
              formatPhoneNumber={formatPhoneNumber}
              setCustomerId={setCustomerId}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}
