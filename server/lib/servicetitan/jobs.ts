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
  campaignId?: number;
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
  appointmentStart: string;
  appointmentEnd: string;
  locationZip?: string;
  locationAddress?: string;
  locationCity?: string;
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
      
      if (appointments.length > 0) {
        console.log(`[ServiceTitan Jobs] Sample appointment:`, JSON.stringify(appointments[0], null, 2));
      }
      
      // Now fetch job details for each appointment to get location data
      const jobsMap = new Map<number, any>();
      
      for (const apt of appointments) {
        if (!apt.jobId || jobsMap.has(apt.jobId)) continue;
        
        try {
          const job = await serviceTitanAuth.makeRequest<any>(
            `jpm/v2/tenant/${this.tenantId}/jobs/${apt.jobId}?includeLocation=true`
          );
          jobsMap.set(apt.jobId, job);
        } catch (error) {
          console.error(`[ServiceTitan Jobs] Error fetching job ${apt.jobId}:`, error);
        }
      }
      
      console.log(`[ServiceTitan Jobs] Fetched ${jobsMap.size} unique jobs`);
      if (jobsMap.size > 0) {
        const firstJob = Array.from(jobsMap.values())[0];
        console.log(`[ServiceTitan Jobs] Sample job with location:`, JSON.stringify({
          id: firstJob.id,
          locationZip: firstJob.location?.zip,
          locationAddress: firstJob.location?.address,
        }, null, 2));
      }
      
      // Extract job + location data
      const jobsWithLocation: JobWithLocation[] = appointments
        .filter(apt => jobsMap.has(apt.jobId))
        .map(apt => {
          const job = jobsMap.get(apt.jobId);
          return {
            id: job.id,
            jobNumber: job.jobNumber,
            appointmentStart: apt.arrivalWindowStart || apt.start,
            appointmentEnd: apt.arrivalWindowEnd || apt.end,
            locationZip: job.location?.zip,
            locationAddress: job.location?.street,
            locationCity: job.location?.city,
          };
        });

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
      // If provided explicitly, use those. Otherwise, use arrival window times.
      const appointmentStart = data.appointmentStart || arrivalWindow.start;
      const appointmentEnd = data.appointmentEnd || arrivalWindow.end;

      const payload = {
        customerId: data.customerId,
        locationId: data.locationId,
        businessUnitId: data.businessUnitId,
        jobTypeId: data.jobTypeId,
        priority: 'Normal',
        summary: data.summary,
        ...(data.bookingProviderId && { bookingProviderId: data.bookingProviderId }),
        ...(data.campaignId && { campaignId: data.campaignId }),
        // First appointment is created automatically with job
        appointment: {
          start: appointmentStart, // Actual scheduled slot
          end: appointmentEnd, // Actual scheduled slot end
          arrivalWindowStart: arrivalWindow.start, // Customer promise
          arrivalWindowEnd: arrivalWindow.end, // Customer promise
          ...(data.specialInstructions && { specialInstructions: data.specialInstructions }),
        },
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanJob>(
        `jpm/v2/tenant/${this.tenantId}/jobs`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan Jobs] Created job ${response.jobNumber} (ID: ${response.id}) with appointment ${response.firstAppointmentId}`);
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
  async cancelJob(jobId: number, cancelReasonId: number): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `jpm/v2/tenant/${this.tenantId}/jobs/${jobId}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ cancelReasonId }),
        }
      );
      console.log(`[ServiceTitan Jobs] Cancelled job ${jobId}`);
    } catch (error) {
      console.error(`[ServiceTitan Jobs] Error cancelling job ${jobId}:`, error);
      throw error;
    }
  }
}

export const serviceTitanJobs = new ServiceTitanJobs();
