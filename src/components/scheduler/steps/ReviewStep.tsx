/**
 * Review & Confirm Step
 * 
 * Final confirmation before booking the appointment in ServiceTitan.
 */

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Calendar, Clock, MapPin, User, Mail, Phone, Key, Wrench, Camera, X } from 'lucide-react';
import { format } from 'date-fns';
import { getJobTypeMeta } from '@/lib/schedulerJobCatalog';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { LocationContactsSummary } from '../LocationContactsSummary';
import type { JobType, CustomerInfo, TimeSlot } from '@shared/types/scheduler';

interface SchedulerSession {
  token: string | null;
  verificationMethod: 'phone' | 'email' | null;
  verifiedAt: number | null;
  customerId: number | null;
  expiresAt: number | null;
}

interface ReviewStepProps {
  jobType: JobType;
  customer: CustomerInfo;
  timeSlot: TimeSlot;
  voucherCode?: string;
  problemDescription?: string;
  onProblemDescriptionChange?: (description: string) => void;
  onSuccess: () => void;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
  session?: SchedulerSession; // Session for contact management
}

export function ReviewStep({ jobType, customer, timeSlot, voucherCode, problemDescription, onProblemDescriptionChange, onSuccess, utmSource, utmMedium, utmCampaign, referralCode, session }: ReviewStepProps) {
  const [isBooked, setIsBooked] = useState(false);
  const [problem, setProblem] = useState(problemDescription || '');
  const [specialInstructions, setSpecialInstructions] = useState(customer.notes || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast} = useToast();
  const meta = getJobTypeMeta(jobType.name);
  const Icon = meta.icon;

  const handleProblemChange = (value: string) => {
    setProblem(value);
    onProblemDescriptionChange?.(value);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported format. Please use JPG, PNG, WebP, or PDF.`,
          variant: "destructive",
        });
      }
      if (!isValidSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive",
        });
      }
      
      return isValidType && isValidSize;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (jobId: number) => {
    if (selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      formData.append('jobId', jobId.toString());
      
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      const response = await fetch('/api/scheduler/upload-attachments', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }
      
      const result = await response.json();
      console.log(`Uploaded ${result.filesUploaded} photo(s) to job ${jobId}`);
      
      // Show success toast ONLY on successful upload
      toast({
        title: "Photos Uploaded!",
        description: `${result.filesUploaded} photo(s) successfully attached to your appointment.`,
      });
    } catch (error) {
      console.error('File upload failed:', error);
      toast({
        title: "Photo Upload Failed",
        description: "Your appointment is booked, but we couldn't upload the photos. You can add them later.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email || '', // Handle optional email - ServiceTitan may require empty string
        customerPhone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zip,
        requestedService: jobType.name,
        preferredDate: new Date(timeSlot.start),
        // Arrival window = 4-hour customer promise (e.g., 8am-12pm)
        arrivalWindowStart: timeSlot.arrivalWindowStart,
        arrivalWindowEnd: timeSlot.arrivalWindowEnd,
        // Appointment slot = actual 2-hour booking (e.g., 10am-12pm within 8am-12pm window)
        appointmentStart: timeSlot.start,
        appointmentEnd: timeSlot.end,
        specialInstructions: specialInstructions || undefined,
        problemDescription: problem || undefined, // Customer's description of the issue
        ...(voucherCode && { grouponVoucher: voucherCode }), // Groupon or promotional voucher code
        bookingSource: 'scheduler_wizard',
        utm_source: utmSource || 'website',
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
        ...(referralCode && { referralToken: referralCode }),
        ...(customer.serviceTitanId && { serviceTitanId: customer.serviceTitanId }),
        ...(customer.locationId && { locationId: customer.locationId }),
        ...(timeSlot.technicianId && { technicianId: timeSlot.technicianId }), // Pre-assigned technician from smart slot
      };

      // Add Authorization header if session token is present (optional - for audit trail)
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch('/api/scheduler/book', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Booking failed' }));
        throw new Error(error.message || 'Booking failed');
      }

      return await response.json();
    },
    onSuccess: async (data: any) => {
      setIsBooked(true);
      toast({
        title: "Appointment Booked!",
        description: data.message || `Your ${jobType.name} appointment is confirmed. Job #${data.jobNumber || ''}`,
      });
      
      // Upload files if selected, then navigate
      if (selectedFiles.length > 0 && data.jobId) {
        await uploadFiles(data.jobId); // Wait for upload to complete
        setTimeout(() => {
          onSuccess();
        }, 1000); // Brief delay after upload
      } else {
        // No files - navigate after 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  if (isBooked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Appointment Confirmed!</h3>
          <p className="text-muted-foreground">
            We'll send you a confirmation email shortly.
          </p>
        </div>
        
        {/* Show upload progress in success view */}
        {uploadingFiles && selectedFiles.length > 0 && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 max-w-md">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Uploading {selectedFiles.length} photo(s)...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This may take a moment for larger files
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-muted ${meta.color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold">{meta.displayName || jobType.name}</h3>
            {meta.marketingCopy && (
              <p className="text-sm text-muted-foreground mt-1">{meta.marketingCopy}</p>
            )}
            <Badge variant="secondary" className="mt-2">
              {meta.category}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Appointment Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Appointment Details
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{timeSlot.timeLabel}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(timeSlot.start), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          
          {timeSlot.proximityScore && timeSlot.proximityScore > 70 && (
            <div className="flex items-start gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Fuel-Efficient Appointment</p>
                <p className="text-xs">
                  This time is optimized to reduce driving and save fuel
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Your Information
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatPhoneNumber(customer.phone)}
              </p>
            </div>
          </div>
          
          <div className="text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {customer.email}
            </p>
          </div>

          <Separator />

          <div className="text-sm">
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Service Address
            </p>
            <p className="font-medium">
              {customer.address}<br />
              {customer.city}, {customer.state} {customer.zip}
            </p>
          </div>

        </div>
      </Card>

      {/* Location-Specific Contacts (with optional CRUD if authenticated) */}
      {customer.serviceTitanId && (
        <LocationContactsSummary
          customerId={customer.serviceTitanId}
          locationId={customer.locationId}
          sessionToken={session?.token}
        />
      )}

      {/* Problem Description */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label htmlFor="problemDescription" className="flex items-center gap-2 text-base font-semibold">
            <Wrench className="w-5 h-5" />
            What's going on? (Optional)
          </Label>
          <Textarea
            id="problemDescription"
            placeholder="Example: Water heater is leaking and making a loud banging noise..."
            value={problem}
            onChange={(e) => handleProblemChange(e.target.value)}
            rows={4}
            maxLength={500}
            className="resize-none"
            data-testid="textarea-problem-description"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Be specific: location, sounds, when it started, what you've tried, etc.</p>
            <p>{problem.length}/500</p>
          </div>
        </div>
      </Card>

      {/* Special Instructions / Access Codes */}
      <Card className="p-6">
        <div className="space-y-3">
          <Label htmlFor="specialInstructions" className="flex items-center gap-2 text-base font-semibold">
            <Key className="w-5 h-5" />
            Gate Code / Access Instructions (Optional)
          </Label>
          <Textarea
            id="specialInstructions"
            placeholder="Gate code, parking instructions, where to find you, pet warnings, etc."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
            data-testid="textarea-special-instructions"
          />
          <p className="text-xs text-muted-foreground">
            Examples: "Gate code: #1234", "Park in driveway", "Use side entrance", "Dog in backyard"
          </p>
        </div>
      </Card>

      {/* Photo Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Camera className="w-5 h-5" />
            Add Photos (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Help us understand the issue better by uploading photos. Max 5 files, 10MB each.
          </p>
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />
          
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-muted rounded-lg p-3 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm truncate flex-1">{file.name}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Photos Button */}
          {selectedFiles.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              data-testid="button-add-photos"
            >
              <Camera className="w-4 h-4 mr-2" />
              {selectedFiles.length > 0 ? 'Add More Photos' : 'Add Photos'}
            </Button>
          )}
        </div>
      </Card>

      {/* Upload Progress Indicator */}
      {uploadingFiles && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Uploading {selectedFiles.length} photo(s)...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This may take a moment for larger files
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Button */}
      <Button
        onClick={() => bookMutation.mutate()}
        disabled={bookMutation.isPending}
        size="lg"
        className="w-full"
        data-testid="button-confirm-booking"
      >
        {bookMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Booking Appointment...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Appointment
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By confirming, you agree to receive appointment reminders and updates via email and SMS.
      </p>
    </div>
  );
}
