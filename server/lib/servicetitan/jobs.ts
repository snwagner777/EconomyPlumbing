/**
 * ServiceTitan Jobs API - Job and Appointment Booking
 * 
 * Handles job creation with appointments for direct scheduling.
 */

import { serviceTitanAuth } from './auth';
import pLimit from 'p-limit';

interface CreateJobData {
  customerId: number;
  locationId: number;
  businessUnitId: number;
  jobTypeId: number;
  summary: string;
  preferredDate?: Date;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  arrivalWindowStart?: string; // ISO timestamp for customer promise (e.g., "8-12")
  arrivalWindowEnd?: string; // ISO timestamp for customer promise
  appointmentStart?: string; // ISO timestamp for actual scheduled slot (e.g., "10-12")
  appointmentEnd?: string; // ISO timestamp for actual scheduled slot
  specialInstructions?: string;
  bookingProviderId?: number;
  campaignId: number; // REQUIRED per API docs
  technicianId?: number; // Optional technician assignment
}

interface ServiceTitanJob {
  id: number;
  jobNumber: string;
  customerId: number;
  locationId: number;
  businessUnitId: number;
  jobTypeId: number;
  summary: string;
  status: string;
  appointmentCount: number;
  firstAppointmentId: number;
  createdOn: string;
}

interface ServiceTitanAppointment {
  id: number;
  jobId: number;
  start: string;
  end: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  status: string;
}

interface JobWithLocation {
  id: number;
  jobNumber: string;
  appointmentId: number;
  appointmentStart: string;
  appointmentEnd: string;
  locationZip?: string;
  locationAddress?: string;
  locationCity?: string;
  technicianId?: number;
}

export class ServiceTitanJobs {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get scheduled jobs for a date range (for smart scheduling optimization)
   * Uses Appointments API instead of Jobs API for better reliability
   */
  async getJobsForDateRange(startDate: Date, endDate: Date): Promise<JobWithLocation[]> {
    try {
      console.log(`[ServiceTitan Jobs] Fetching appointments from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Use Appointments API directly - more reliable than Jobs API with includeAppointments
      const queryParams = new URLSearchParams({
        startsOnOrAfter: startDate.toISOString(),
        startsOnOrBefore: endDate.toISOString(),
        page: '1',
        pageSize: '500',
      });

      const response = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `jpm/v2/tenant/${this.tenantId}/appointments?${queryParams.toString()}`
      );

      const appointments = response.data || [];
      console.log(`[ServiceTitan Jobs] API returned ${appointments.length} appointments`);
      
      // Group appointments by day to see distribution
      const appointmentsByDay = new Map<string, any[]>();
      for (const apt of appointments) {
        const startDate = new Date(apt.start || apt.arrivalWindowStart);
        const dayKey = startDate.toISOString().split('T')[0];
        if (!appointmentsByDay.has(dayKey)) {
          appointmentsByDay.set(dayKey, []);
        }
        appointmentsByDay.get(dayKey)!.push(apt);
      }
      
      console.log(`[ServiceTitan Jobs] Appointments by day:`);
      for (const [day, apts] of appointmentsByDay.entries()) {
        console.log(`  ${day}: ${apts.length} appointments`);
      }
      
      if (appointments.length > 0) {
        console.log(`[ServiceTitan Jobs] Sample appointment:`, JSON.stringify(appointments[0], null, 2));
      }
      
      // Fetch jobs and locations using the correct API flow:
      // 1. Appointment has jobId
      // 2. Job API (/jobs/{jobId}) returns locationId
      // 3. Locations API (/locations/{locationId}) returns full address
      
      const jobsWithLocation: JobWithLocation[] = [];
      const jobCache = new Map<number, any>();
      const locationCache = new Map<number, any>();
      
      for (const apt of appointments) {
        try {
          // Step 1: Get the Job using jobId from appointment
          let job = jobCache.get(apt.jobId);
          if (!job) {
            try {
              job = await serviceTitanAuth.makeRequest<any>(
                `jpm/v2/tenant/${this.tenantId}/jobs/${apt.jobId}`
              );
              jobCache.set(apt.jobId, job);
            } catch (error) {
              console.error(`[ServiceTitan Jobs] Error fetching job ${apt.jobId}:`, error);
              continue;
            }
          }
          
          // Step 2: Get the Location using locationId from job
          let location = null;
          if (job.locationId) {
            location = locationCache.get(job.locationId);
            if (!location) {
              try {
                location = await serviceTitanAuth.makeRequest<any>(
                  `crm/v2/tenant/${this.tenantId}/locations/${job.locationId}`
                );
                locationCache.set(job.locationId, location);
                console.log(`[ServiceTitan Jobs] Fetched location ${job.locationId}:`, {
                  zip: location.address?.zip,
                  street: location.address?.street,
                  city: location.address?.city,
                });
              } catch (error) {
                console.error(`[ServiceTitan Jobs] Error fetching location ${job.locationId}:`, error);
              }
            }
          }
          
          // Step 3: Build the job with location data
          jobsWithLocation.push({
            id: apt.jobId,
            jobNumber: job.jobNumber || apt.appointmentNumber,
            appointmentId: apt.id,
            appointmentStart: apt.arrivalWindowStart || apt.start,
            appointmentEnd: apt.arrivalWindowEnd || apt.end,
            locationZip: location?.address?.zip,
            locationAddress: location?.address?.street,
            locationCity: location?.address?.city,
          });
        } catch (error) {
          console.error(`[ServiceTitan Jobs] Error processing appointment ${apt.id}:`, error);
        }
      }
      
      console.log(`[ServiceTitan Jobs] Fetched ${jobCache.size} unique jobs and ${locationCache.size} unique locations`);

      console.log(`[ServiceTitan Jobs] Returning ${jobsWithLocation.length} jobs with location data`);
      if (jobsWithLocation.length > 0) {
        console.log(`[ServiceTitan Jobs] Sample:`, jobsWithLocation[0]);
      }
      return jobsWithLocation;
    } catch (error) {
      console.error('[ServiceTitan Jobs] Error fetching jobs for date range:', error);
      return []; // Return empty array on error (graceful degradation)
    }
  }

  /**
   * Assign a technician to an appointment
   * 
   * Uses the dispatch API to create an official technician assignment
   */
  async assignTechnician(appointmentId: number, technicianId: number): Promise<void> {
    try {
      const payload = {
        appointmentId,
        technicianId,
        status: 'Scheduled',
      };

      await serviceTitanAuth.makeRequest(
        `dispatch/v2/tenant/${this.tenantId}/appointment-assignments`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      
      console.log(`[ServiceTitan Jobs] Assigned technician ${technicianId} to appointment ${appointmentId}`);
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error assigning technician:`, error);
      throw error;
    }
  }

  /**
   * Create a pinned note on a job (e.g., Groupon voucher, gate code, special instructions)
   */
  async createJobNote(jobId: number, text: string, pinned: boolean = true): Promise<{ id: number }> {
    try {
      const payload = {
        text,
        pinned,
      };

      const response = await serviceTitanAuth.makeRequest<{ id: number }>(
        `jpm/v2/tenant/${this.tenantId}/jobs/${jobId}/notes`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan Jobs] Created ${pinned ? 'pinned ' : ''}note on job ${jobId}: ${response.id}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error creating note on job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch technician assignments from Dispatch API
   * Returns a map of appointmentId -> technicianId
   * 
   * Uses the AppointmentAssignments_GetList endpoint from dispatch module.
   */
  async getTechnicianAssignments(
    appointmentIds: number[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<number, number>> {
    try {
      if (appointmentIds.length === 0) {
        return new Map();
      }

      console.log(`[ServiceTitan Jobs] Fetching technician assignments for appointments:`, appointmentIds);
      
      const assignmentMap = new Map<number, number>();
      
      // Use appointmentIds parameter to filter for our specific appointments!
      const queryParams = new URLSearchParams({
        appointmentIds: appointmentIds.join(','), // Comma-separated list of appointment IDs
        pageSize: '500',
      });

      const response = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `dispatch/v2/tenant/${this.tenantId}/appointment-assignments?${queryParams.toString()}`
      );

      const assignments = response.data || [];
      console.log(`[ServiceTitan Jobs] Fetched ${assignments.length} assignments for ${appointmentIds.length} appointments`);
      
      // Log a sample
      if (assignments.length > 0) {
        console.log(`[ServiceTitan Jobs] Sample assignment:`, JSON.stringify(assignments[0], null, 2));
      }
      
      // Extract technician IDs
      for (const assignment of assignments) {
        const techId = assignment.technicianId || assignment.assignedTechnicianId;
        
        if (techId && assignment.appointmentId) {
          assignmentMap.set(assignment.appointmentId, techId);
          console.log(`[ServiceTitan Jobs] ✓ Appointment ${assignment.appointmentId} → Technician ${techId} (${assignment.technicianName || 'unknown'})`);
        }
      }

      console.log(`[ServiceTitan Jobs] Found ${assignmentMap.size}/${appointmentIds.length} technician assignments`);
      return assignmentMap;
    } catch (error) {
      console.error('[ServiceTitan Jobs] Error fetching technician assignments:', error);
      return new Map(); // Return empty map on error (graceful degradation)
    }
  }

  /**
   * Calculate arrival window based on time slot preference
   */
  private getArrivalWindow(preferredDate: Date, timeSlot?: string): { start: string; end: string } {
    const date = new Date(preferredDate);
    
    // Set time based on slot
    switch (timeSlot) {
      case 'morning':
        date.setHours(8, 0, 0, 0); // 8 AM
        break;
      case 'afternoon':
        date.setHours(13, 0, 0, 0); // 1 PM
        break;
      case 'evening':
        date.setHours(17, 0, 0, 0); // 5 PM
        break;
      default:
        date.setHours(9, 0, 0, 0); // Default 9 AM
    }

    const startTime = new Date(date);
    const endTime = new Date(date);
    endTime.setHours(endTime.getHours() + 4); // 4-hour window

    return {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    };
  }

  /**
   * Create a new job with appointment in ServiceTitan
   */
  async createJob(data: CreateJobData): Promise<ServiceTitanJob> {
    try {
      // Use exact arrival window times if provided, otherwise calculate from preferredDate/TimeSlot
      let arrivalWindow: { start: string; end: string };
      
      if (data.arrivalWindowStart && data.arrivalWindowEnd) {
        // Use exact times from smart scheduler
        arrivalWindow = {
          start: data.arrivalWindowStart,
          end: data.arrivalWindowEnd,
        };
        console.log(`[ServiceTitan Jobs] Using exact arrival window: ${arrivalWindow.start} to ${arrivalWindow.end}`);
      } else if (data.preferredDate) {
        // Fall back to calculated window from preferred time slot
        arrivalWindow = this.getArrivalWindow(data.preferredDate, data.preferredTimeSlot);
      } else {
        // Default to next business day, 9 AM - 1 PM
        arrivalWindow = {
          start: new Date(Date.now() + 86400000).toISOString(),
          end: new Date(Date.now() + 86400000 + 14400000).toISOString(),
        };
      }

      // Determine appointment start/end (actual scheduled slot)
      // Appointments are 2 hours long, arrival windows are 4 hours
      let appointmentStart: string;
      let appointmentEnd: string;
      
      if (data.appointmentStart && data.appointmentEnd) {
        // Use explicitly provided times
        appointmentStart = data.appointmentStart;
        appointmentEnd = data.appointmentEnd;
      } else {
        // Create a 2-hour appointment starting at the arrival window start
        const startDate = new Date(arrivalWindow.start);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 2); // 2-hour appointment duration
        
        appointmentStart = startDate.toISOString();
        appointmentEnd = endDate.toISOString();
      }

      // Build appointment object
      const appointmentData: any = {
        start: appointmentStart, // Actual scheduled slot
        end: appointmentEnd, // Actual scheduled slot end
        arrivalWindowStart: arrivalWindow.start, // Customer promise
        arrivalWindowEnd: arrivalWindow.end, // Customer promise
      };
      
      // Add special instructions if provided
      if (data.specialInstructions) {
        appointmentData.specialInstructions = data.specialInstructions;
      }
      
      // Add technician assignment if provided (using correct field name from API docs)
      if (data.technicianId) {
        appointmentData.technicianIds = [data.technicianId];
      }

      // Build complete job payload with correct structure
      const payload = {
        customerId: data.customerId,
        locationId: data.locationId,
        businessUnitId: data.businessUnitId,
        jobTypeId: data.jobTypeId,
        priority: 'Normal', // REQUIRED at top level
        summary: data.summary, // REQUIRED at top level
        campaignId: data.campaignId, // REQUIRED field
        ...(data.bookingProviderId && { bookingProviderId: data.bookingProviderId }),
        // REQUIRED: appointments array (not singular appointment)
        appointments: [appointmentData],
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanJob>(
        `jpm/v2/tenant/${this.tenantId}/jobs`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan Jobs] Created job ${response.jobNumber} (ID: ${response.id}) with appointment ${response.firstAppointmentId}`);
      
      // Log technician assignment for debugging
      if (data.technicianId) {
        console.log(`[ServiceTitan Jobs] Technician ${data.technicianId} should be auto-assigned via technicianIds field`);
      }
      
      return response;
    } catch (error) {
      console.error('[ServiceTitan Jobs] Error creating job:', error);
      throw error;
    }
  }

  /**
   * Get job details
   */
  async getJob(jobId: number): Promise<ServiceTitanJob> {
    try {
      const response = await serviceTitanAuth.makeRequest<ServiceTitanJob>(
        `jpm/v2/tenant/${this.tenantId}/jobs/${jobId}`
      );
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error getting job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get appointment details
   */
  async getAppointment(appointmentId: number): Promise<ServiceTitanAppointment> {
    try {
      const response = await serviceTitanAuth.makeRequest<ServiceTitanAppointment>(
        `jpm/v2/tenant/${this.tenantId}/appointments/${appointmentId}`
      );
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error getting appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: number, options: { reasonId: number; memo: string }): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `jpm/v2/tenant/${this.tenantId}/jobs/${jobId}/cancel`,
        {
          method: 'PUT',
          body: JSON.stringify(options),
        }
      );
      console.log(`[ServiceTitan Jobs] Cancelled job ${jobId}`);
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error cancelling job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: number,
    options: {
      start?: string; // ISO datetime
      end?: string; // ISO datetime
      arrivalWindowStart?: string; // ISO datetime
      arrivalWindowEnd?: string; // ISO datetime
    }
  ): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `jpm/v2/tenant/${this.tenantId}/appointments/${appointmentId}/reschedule`,
        {
          method: 'PATCH',
          body: JSON.stringify(options),
        }
      );
      console.log(`[ServiceTitan Jobs] Rescheduled appointment ${appointmentId}`);
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error rescheduling appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  /**
   * Upload file attachment to a job
   * MODULAR - Use from scheduler, customer portal, chatbot, or any context
   * 
   * @param jobId - ServiceTitan job ID
   * @param file - File buffer or Blob
   * @param fileName - Original filename
   * @returns Uploaded filename from ServiceTitan
   */
  async uploadJobAttachment(
    jobId: number,
    file: Buffer | Blob,
    fileName: string
  ): Promise<{ fileName: string }> {
    try {
      const formData = new FormData();
      
      // Convert Buffer to Blob if needed
      const blob = file instanceof Buffer 
        ? new Blob([file])
        : file;
      
      formData.append('file', blob, fileName);

      const response = await serviceTitanAuth.makeRequest<{ fileName: string }>(
        `forms/v2/tenant/${this.tenantId}/jobs/${jobId}/attachments`,
        {
          method: 'POST',
          body: formData,
          // Let fetch set Content-Type with boundary for multipart/form-data
          headers: {},
        }
      );

      console.log(`[ServiceTitan Jobs] Uploaded attachment "${response.fileName}" to job ${jobId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error uploading attachment to job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Upload multiple file attachments to a job
   * MODULAR - Batch upload for efficiency
   * 
   * @param jobId - ServiceTitan job ID
   * @param files - Array of { buffer, fileName } objects
   * @returns Array of uploaded filenames
   */
  async uploadJobAttachments(
    jobId: number,
    files: Array<{ buffer: Buffer | Blob; fileName: string }>
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(({ buffer, fileName }) =>
        this.uploadJobAttachment(jobId, buffer, fileName)
      );

      const results = await Promise.all(uploadPromises);
      const uploadedFileNames = results.map(r => r.fileName);

      console.log(`[ServiceTitan Jobs] Uploaded ${uploadedFileNames.length} attachments to job ${jobId}`);
      return uploadedFileNames;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error uploading attachments to job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get attachments/photos for a job
   * MODULAR - Use for photo fetch automation, admin panel display
   * 
   * Returns array of job attachments with download URLs
   * 
   * @param jobId - ServiceTitan job ID
   * @returns Array of attachments with file info and download URLs
   */
  async getJobAttachments(jobId: number): Promise<Array<{
    fileName: string;
    originalFileName: string;
    createdFrom: string;
    thumbnail?: string;
    downloadUrl: string;
  }>> {
    try {
      const response = await serviceTitanAuth.makeRequest<{ 
        data: Array<{
          fileName: string;
          originalFileName: string;
          createdFrom: string;
          thumbnail?: string;
          downloadUrl: string;
        }>
      }>(
        `forms/v2/tenant/${this.tenantId}/jobs/${jobId}/attachments`
      );

      console.log(`[ServiceTitan Jobs] Fetched ${response.data?.length || 0} attachments for job ${jobId}`);
      return response.data || [];
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error fetching attachments for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Download a job attachment file
   * MODULAR - Use for photo fetch automation
   * 
   * Downloads the actual file content from ServiceTitan
   * 
   * @param downloadUrl - The downloadUrl from getJobAttachments()
   * @returns File buffer
   */
  async downloadAttachment(downloadUrl: string): Promise<Buffer> {
    try {
      // ServiceTitan download URLs are full URLs, not relative paths
      const token = await serviceTitanAuth.getAccessToken();
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error downloading attachment from ${downloadUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get all jobs for a customer (for customer portal)
   * MODULAR - Use from customer portal, chatbot, or any context
   * 
   * Handles pagination automatically - fetches ALL jobs across all pages
   * 
   * @param customerId - ServiceTitan customer ID
   * @param pageSize - Number of jobs per page (default 50)
   * @returns Array of ALL jobs for the customer
   */
  async getCustomerJobs(customerId: number, pageSize: number = 50): Promise<ServiceTitanJob[]> {
    try {
      console.log(`[ServiceTitan Jobs] Fetching all jobs for customer ${customerId} (with pagination)`);
      
      const allJobs: ServiceTitanJob[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const queryParams = new URLSearchParams({
          customerId: customerId.toString(),
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        });

        const response = await serviceTitanAuth.makeRequest<{ data: ServiceTitanJob[]; hasMore: boolean }>(
          `jpm/v2/tenant/${this.tenantId}/jobs?${queryParams.toString()}`
        );

        allJobs.push(...response.data);
        hasMore = response.hasMore;
        
        console.log(`[ServiceTitan Jobs] Page ${currentPage}: ${response.data.length} jobs, hasMore: ${hasMore}`);
        
        if (hasMore) {
          currentPage++;
        }
      }

      console.log(`[ServiceTitan Jobs] Total: ${allJobs.length} jobs for customer ${customerId}`);
      return allJobs;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error fetching jobs for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific job
   * MODULAR - Use from customer portal, chatbot, or any context
   * 
   * Handles pagination automatically - fetches ALL appointments for the job
   * 
   * @param jobId - ServiceTitan job ID
   * @returns Array of ALL appointments for the job
   */
  async getJobAppointments(jobId: number): Promise<ServiceTitanAppointment[]> {
    try {
      const allAppointments: ServiceTitanAppointment[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 50;

      while (hasMore) {
        const queryParams = new URLSearchParams({
          jobId: jobId.toString(),
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        });

        const response = await serviceTitanAuth.makeRequest<{ data: ServiceTitanAppointment[]; hasMore?: boolean }>(
          `jpm/v2/tenant/${this.tenantId}/appointments?${queryParams.toString()}`
        );

        allAppointments.push(...response.data);
        
        // Check if there are more pages
        hasMore = response.hasMore || false;
        
        if (hasMore) {
          currentPage++;
        }
      }

      return allAppointments;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error fetching appointments for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get all appointments for a customer with job details
   * MODULAR - Use from customer portal to display appointment history
   * 
   * Uses concurrency limiting (5 parallel requests) to avoid overwhelming ServiceTitan API
   * 
   * @param customerId - ServiceTitan customer ID
   * @returns Array of jobs with their appointments embedded
   */
  async getCustomerAppointments(customerId: number): Promise<Array<ServiceTitanJob & { appointments: ServiceTitanAppointment[] }>> {
    try {
      console.log(`[ServiceTitan Jobs] Fetching appointments for customer ${customerId}`);
      
      // Step 1: Get all jobs for the customer (handles pagination internally)
      const jobs = await this.getCustomerJobs(customerId);

      // Step 2: Fetch appointments for each job with concurrency limit (5 parallel requests max)
      const limit = pLimit(5);
      
      const jobsWithAppointments = await Promise.all(
        jobs.map((job) =>
          limit(async () => {
            const appointments = await this.getJobAppointments(job.id);
            return {
              ...job,
              appointments,
            };
          })
        )
      );

      console.log(`[ServiceTitan Jobs] Fetched ${jobsWithAppointments.length} jobs with appointments for customer ${customerId}`);
      return jobsWithAppointments;
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error fetching customer appointments:`, error);
      throw error;
    }
  }
}

export const serviceTitanJobs = new ServiceTitanJobs();
