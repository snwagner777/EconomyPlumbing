/**
 * ServiceTitan Jobs API - Job and Appointment Booking
 * 
 * Handles job creation with appointments for direct scheduling.
 */

import { serviceTitanAuth } from './auth';

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
}

export const serviceTitanJobs = new ServiceTitanJobs();
