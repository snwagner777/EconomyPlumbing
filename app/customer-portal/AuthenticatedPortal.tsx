/**
 * Authenticated Customer Portal Content
 * 
 * Extracted from CustomerPortalClient to fix JSX structure issues.
 * Contains all authenticated portal UI (account switcher, dashboard, dialogs, etc.)
 */

'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PhoneConfig } from "@/server/lib/phoneNumbers";
import type { UseMutationResult } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ContactForm, useAddCustomerContact, useAddLocationContact, useUpdateContact, useDeleteContact } from "@/modules/contacts";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { queryClient } from "@/lib/queryClient";
import { PortalReferralForm } from "@/components/referral";
import { VouchersSection } from "./VouchersSection";
import { MembershipsSection } from "./components/MembershipsSection";

/**
 * Manage Location Contacts Dialog Component
 * Extracted for better organization and to handle enriched contact data with Edit/Delete
 */
interface ManageLocationContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocation: any;
  onClose: () => void;
}

function ManageLocationContactsDialog({
  open,
  onOpenChange,
  selectedLocation,
  onClose,
}: ManageLocationContactsDialogProps) {
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<any>(null);
  const [contactToDelete, setContactToDelete] = useState<any>(null);
  
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  const addLocationContact = useAddLocationContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // Helper to check if a contact method is a phone type (covers all phone variants)
  const isPhoneType = (type: string) => {
    return type.includes('Phone'); // Matches: MobilePhone, Phone, HomePhone, WorkPhone, etc.
  };

  const handleEditContact = (contact: any) => {
    setContactToEdit(contact);
    setEditName(contact.name || '');
    
    // Extract phone and email from methods - support ALL phone types
    const phoneMethod = contact.methods?.find((m: any) => isPhoneType(m.type));
    const emailMethod = contact.methods?.find((m: any) => m.type === 'Email');
    
    setEditPhone(phoneMethod?.value || '');
    setEditEmail(emailMethod?.value || '');
    setEditContactOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!contactToEdit) return;

    const phoneMethod = contactToEdit.methods?.find((m: any) => isPhoneType(m.type));
    const emailMethod = contactToEdit.methods?.find((m: any) => m.type === 'Email');

    await updateContact.mutateAsync({
      contactId: contactToEdit.id,
      name: editName || undefined,
      phone: editPhone || undefined,
      phoneMethodId: phoneMethod?.id,
      email: editEmail || undefined,
      emailMethodId: emailMethod?.id,
    });

    setEditContactOpen(false);
    setContactToEdit(null);
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    await deleteContact.mutateAsync(contactToDelete.id);
    setDeleteContactOpen(false);
    setContactToDelete(null);
  };

  return (
    <>
      {/* Main Manage Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="dialog-manage-location-contacts">
          <DialogHeader>
            <DialogTitle>Manage Location Contacts</DialogTitle>
            <DialogDescription>
              {selectedLocation?.name || 'Location'} - Add or manage contacts specific to this location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Existing contacts - now with Edit/Delete */}
            {selectedLocation?.contacts && selectedLocation.contacts.length > 0 && (
              <div className="space-y-3">
                <Label>Current Contacts</Label>
                {selectedLocation.contacts.map((contact: any) => (
                  <Card key={contact.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          {contact.name && (
                            <p className="font-medium text-sm">{contact.name}</p>
                          )}
                          {contact.title && (
                            <p className="text-xs text-muted-foreground">{contact.title}</p>
                          )}
                          
                          {/* Display all contact methods */}
                          <div className="space-y-1">
                            {contact.methods?.map((method: any) => {
                              const isEmail = method.type === 'Email';
                              const isPhone = method.type.includes('Phone'); // Support ALL phone types
                              
                              if (!isEmail && !isPhone) return null;
                              
                              return (
                                <div key={method.id} className="flex items-center gap-2 text-sm">
                                  {isEmail ? (
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <PhoneIcon className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  <span>
                                    {isEmail ? method.value : formatPhoneNumber(method.value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Edit/Delete Buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                            data-testid={`button-edit-contact-${contact.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setContactToDelete(contact);
                              setDeleteContactOpen(true);
                            }}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new contact form */}
            <div className="border-t pt-4">
              <Label className="mb-3 block">Add New Contact</Label>
              <ContactForm
                showNameField={true}
                onSubmit={async (data) => {
                  if (!selectedLocation?.id) return;
                  await addLocationContact.mutateAsync({
                    locationId: selectedLocation.id,
                    ...data,
                  });
                }}
                isSubmitting={addLocationContact.isPending}
                submitText="Add Contact"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent data-testid="dialog-edit-contact">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information for this location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-contact-name">Name</Label>
              <Input
                id="edit-contact-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contact name"
                data-testid="input-edit-contact-name"
              />
            </div>

            <div>
              <Label htmlFor="edit-contact-phone">Phone Number</Label>
              <Input
                id="edit-contact-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(555) 123-4567"
                data-testid="input-edit-contact-phone"
              />
            </div>

            <div>
              <Label htmlFor="edit-contact-email">Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="contact@example.com"
                data-testid="input-edit-contact-email"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditContactOpen(false)}
              disabled={updateContact.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContact}
              disabled={updateContact.isPending}
              data-testid="button-save-contact"
            >
              {updateContact.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <DialogContent data-testid="dialog-delete-contact">
          <DialogHeader>
            <DialogTitle>Delete Contact?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {contactToDelete && (
            <div className="py-4">
              <Card>
                <CardContent className="p-3">
                  {contactToDelete.name && (
                    <p className="font-medium mb-2">{contactToDelete.name}</p>
                  )}
                  {contactToDelete.methods?.map((method: any) => (
                    <p key={method.id} className="text-sm text-muted-foreground">
                      {method.type === 'Email' ? method.value : formatPhoneNumber(method.value)}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteContactOpen(false)}
              disabled={deleteContact.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContact}
              disabled={deleteContact.isPending}
              data-testid="button-confirm-delete-contact"
            >
              {deleteContact.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Contact'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Props for AuthenticatedPortal component
 * All state, queries, and handlers are passed from CustomerPortalClient
 */
export interface AuthenticatedPortalProps {
  // Flexible typing to accept all props passed from parent
  [key: string]: any;
}

/**
 * Authenticated Customer Portal Component
 */
export function AuthenticatedPortal(props: AuthenticatedPortalProps) {
  // Destructure all props for easier access in JSX
  const {
    customerId,
    customerData,
    isLoading,
    error,
    phoneConfig,
    marbleFallsPhoneConfig,
    toast,
    
    // All other props
    accountSummaries,
    activeAccountTab,
    setActiveAccountTab,
    handleSelectAccount,
    customerLocations,
    activeLocationTab,
    setActiveLocationTab,
    setSchedulerOpen,
    availableCustomerIds,
    handleSwitchAccount,
    isLoadingSwitcher,
    setCustomerId,
    setAddContactOpen,
    addLocationOpen,
    setAddLocationOpen,
    handleEditContacts,
    formatPhoneNumber: formatPhoneNumberProp,
    handleEditAddress,
    referralLinkData,
    referralsData,
    copied,
    copyReferralLink,
    shareViaEmail,
    shareViaSMS,
    setShowReferralModal,
    customerStats,
    recentJobsData,
    refetchRecentJobs,
    upcomingAppointments,
    handleOpenRescheduleDialog,
    handleOpenCancelDialog,
    getStatusBadge,
    formatDate,
    formatTime,
    formatCurrency,
    handleRequestPDF,
    setReviewModalOpen,
    completedAppointments,
    locationsData,
    fetchCustomerLocation,
    emailHistoryData,
    setManageLocationContactsOpen,
    setSelectedLocationForContacts,
    addLocationContact,
    addCustomerContact,
    selectedEstimate,
    setSelectedEstimate,
    setEstimateDetailOpen,
    getExpirationBadge,
    setSchedulerEstimateId,
    setSchedulerSoldHours,
    setShowAcceptanceDialog,
    setAcceptanceTermsAgreed,
    rescheduleDialogOpen,
    setRescheduleDialogOpen,
    appointmentToReschedule,
    newAppointmentDate,
    setNewAppointmentDate,
    newAppointmentWindow,
    setNewAppointmentWindow,
    rescheduleSpecialInstructions,
    setRescheduleSpecialInstructions,
    rescheduleGrouponVoucher,
    setRescheduleGrouponVoucher,
    availableSlots,
    isLoadingSlots,
    timeWindows,
    handleRescheduleAppointment,
    isRescheduling,
    cancelDialogOpen,
    setCancelDialogOpen,
    appointmentToCancel,
    cancelReason,
    setCancelReason,
    handleCancelAppointment,
    isCanceling,
    estimateDetailOpen,
    showAcceptanceDialog,
    isAcceptingEstimate,
    acceptanceTermsAgreed,
    schedulerOpen,
    schedulerEstimateId,
    schedulerSoldHours,
    editContactsOpen,
    setEditContactsOpen,
    editPhone,
    setEditPhone,
    editEmail,
    setEditEmail,
    handleUpdateContacts,
    isUpdatingContacts,
    deleteContactDialogOpen,
    setDeleteContactDialogOpen,
    contactToDelete,
    setContactToDelete,
    handleDeleteContact,
    isDeletingContact,
    editAddressOpen,
    setEditAddressOpen,
    editStreet,
    setEditStreet,
    editCity,
    setEditCity,
    editState,
    setEditState,
    editZip,
    setEditZip,
    handleUpdateAddress,
    isUpdatingAddress,
    emailUsOpen,
    setEmailUsOpen,
    emailUsName,
    setEmailUsName,
    emailUsPhone,
    setEmailUsPhone,
    emailUsEmail,
    setEmailUsEmail,
    emailUsSubject,
    setEmailUsSubject,
    emailUsMessage,
    setEmailUsMessage,
    isSendingEmail,
    reviewModalOpen,
    reviewRating,
    setReviewRating,
    reviewFeedback,
    setReviewFeedback,
    isSubmittingReview,
    manageLocationContactsOpen,
    selectedLocationForContacts,
    showAccountSelection,
    setShowAccountSelection,
    availableAccounts,
    newLocationData,
    setNewLocationData,
    isAddingLocation,
    setIsAddingLocation,
    showReferralModal,
    setIsAcceptingEstimate,
    setIsSendingEmail,
    setIsSubmittingReview,
    handleAddLocation,
    addContactOpen,
  } = props;

  // Local state for inline referral form toggle
  const [showReferralForm, setShowReferralForm] = useState(false);

  // Helper: Extract customer contact info for referral form pre-fill
  const getCustomerContactInfo = () => {
    if (!customerData?.customer) return { name: '', phone: '', email: '' };
    
    const customer = customerData.customer;
    const contacts = customer.contacts || [];
    
    // Find primary phone: prioritize MobilePhone → Phone → first phone-like method
    let phone = '';
    const phoneContact = contacts.find((c: any) => 
      c.methods?.some((m: any) => m.type === 'MobilePhone')
    ) || contacts.find((c: any) => 
      c.methods?.some((m: any) => m.type === 'Phone')
    ) || contacts.find((c: any) => 
      c.methods?.some((m: any) => m.type?.includes('Phone'))
    );
    
    if (phoneContact) {
      const phoneMethod = phoneContact.methods?.find((m: any) => 
        m.type === 'MobilePhone' || m.type === 'Phone' || m.type?.includes('Phone')
      );
      phone = phoneMethod?.value || '';
    }
    
    // Find email contact
    let email = '';
    const emailContact = contacts.find((c: any) => 
      c.methods?.some((m: any) => m.type === 'Email')
    );
    
    if (emailContact) {
      const emailMethod = emailContact.methods?.find((m: any) => m.type === 'Email');
      email = emailMethod?.value || '';
    }
    
    return {
      name: customer.name || '',
      phone,
      email,
    };
  };

  return (
            <>
              {/* Account Switcher Header - Lightweight tabs above dashboard */}
              {accountSummaries.length > 0 && (
                <div className="mb-6">
                  <Tabs value={activeAccountTab} onValueChange={(value) => {
                    const newCustomerId = parseInt(value);
                    handleSelectAccount(newCustomerId);
                    setActiveAccountTab(value);
                  }}>
                    <div className="flex items-center justify-between gap-4">
                      <TabsList>
                        {accountSummaries.map((account) => (
                          <TabsTrigger
                            key={account.id}
                            value={account.id.toString()}
                            data-testid={`tab-account-${account.id}`}
                          >
                            <User className="w-4 h-4 mr-2" />
                            {account.name}
                            {account.type && account.type !== 'Residential' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {account.type}
                              </Badge>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Create New Account",
                            description: "This feature is coming soon!",
                          });
                        }}
                        data-testid="button-create-account"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        + New Account
                      </Button>
                    </div>
                  </Tabs>
                </div>
              )}
            
              {/* Location Tabs - Nested under selected account */}
              {customerLocations.length > 0 && (
                <div className="mb-6">
                  <Tabs value={activeLocationTab} onValueChange={(value) => {
                    setActiveLocationTab(value);
                  }}>
                    <div className="flex items-center justify-between gap-4">
                      <TabsList>
                        {customerLocations.map((location) => {
                          const locationName = location.name || (typeof location.address === 'string' ? location.address : `${location.address.street}, ${location.address.city}`) || 'Unnamed Location';
                          return (
                            <TabsTrigger
                              key={location.id}
                              value={location.id.toString()}
                              data-testid={`tab-location-${location.id}`}
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              {locationName}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Add New Location",
                            description: "This feature is coming soon!",
                          });
                        }}
                        data-testid="button-create-location"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        + New Location
                      </Button>
                    </div>
                  </Tabs>
                </div>
              )}
            
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
                                    window.open('/membership-benefits', '_blank');
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
                                    window.open('/membership-benefits', '_blank');
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
                                    We're excited to serve you! Schedule your first service or call us at {phoneConfig.display} for any plumbing needs.
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
                            message = `We're here when you need us! Remember, we offer maintenance plans, emergency services, and more. Give us a call anytime at ${phoneConfig.display}!`;
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

                  {/* VIP Membership Status - Live ServiceTitan API data via modular wrapper */}
                  <div id="vip-membership-section">
                    <MembershipsSection />
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
                    // Filter by location - backend now enriches estimates with locationId from jobs
                    const openEstimates = (customerData?.estimates || []).filter(est => {
                      const matchesLocation = !activeLocationTab || est.locationId?.toString() === activeLocationTab;
                      return matchesLocation;
                    });

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
                                    Completed: {formatDate(job.completionDate instanceof Date ? job.completionDate.toISOString() : job.completionDate)}
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
                                        (Rated {formatDate(job.ratedAt instanceof Date ? job.ratedAt.toISOString() : String(job.ratedAt))})
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

                        {/* Toggle Referral Form */}
                        <Button
                          onClick={() => setShowReferralForm(!showReferralForm)}
                          className="w-full"
                          variant={showReferralForm ? "outline" : "default"}
                          size="lg"
                          data-testid="button-toggle-referral-form"
                        >
                          <User className="w-4 h-4 mr-2" />
                          {showReferralForm ? 'Hide Referral Form' : 'Refer Someone New'}
                        </Button>

                        {/* Inline Referral Form */}
                        {showReferralForm && (() => {
                          const { name, phone, email } = getCustomerContactInfo();
                          return (
                            <PortalReferralForm
                              referrerName={name}
                              referrerPhone={phone}
                              referrerEmail={email}
                              onSuccess={() => {
                                setShowReferralForm(false);
                                queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
                              }}
                            />
                          );
                        })()}
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
                {/* Schedule button for sold estimates */}
                {selectedEstimate.status === 'Sold' && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      // Calculate soldHours for validation
                      const totalSoldHours = (selectedEstimate.items || [])
                        .filter(item => item.type === 'Service' && item.soldHours)
                        .reduce((total, item) => total + ((item.soldHours || 0) * item.quantity), 0);
                      
                      setSchedulerEstimateId(selectedEstimate.id);
                      setSchedulerSoldHours(totalSoldHours);
                      setEstimateDetailOpen(false);
                      setSchedulerOpen(true);
                    }}
                    data-testid="button-schedule-estimate"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Service ({formatCurrency(selectedEstimate.total)})
                  </Button>
                )}
                
                {/* Accept button for open estimates */}
                {selectedEstimate.status === 'Open' && (
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
                )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEstimateDetailOpen(false)}
                    data-testid="button-close-estimate-detail"
                  >
                    Close
                  </Button>
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
          <ContactForm
            onSubmit={async (data) => {
              if (!customerId) return;
              await addCustomerContact.mutateAsync({
                customerId: parseInt(customerId, 10),
                ...data,
              });
              setAddContactOpen(false);
            }}
            onCancel={() => setAddContactOpen(false)}
            isSubmitting={addCustomerContact.isPending}
            submitText="Add Contact"
          />
        </DialogContent>
      </Dialog>

      {/* Manage Location Contacts Dialog - WITH EDIT/DELETE */}
      <ManageLocationContactsDialog
        open={manageLocationContactsOpen}
        onOpenChange={setManageLocationContactsOpen}
        selectedLocation={selectedLocationForContacts}
        onClose={() => {
          setManageLocationContactsOpen(false);
          setSelectedLocationForContacts(null);
        }}
      />

      {/* Account Switcher Dialog */}
      <Dialog open={showAccountSelection && !!customerId} onOpenChange={setShowAccountSelection}>
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
