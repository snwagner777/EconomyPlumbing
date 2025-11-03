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

export class ServiceTitanJobs {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
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
      const arrivalWindow = data.preferredDate
        ? this.getArrivalWindow(data.preferredDate, data.preferredTimeSlot)
        : {
            // Default to next business day, 9 AM - 1 PM
            start: new Date(Date.now() + 86400000).toISOString(),
            end: new Date(Date.now() + 86400000 + 14400000).toISOString(),
          };

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
          start: arrivalWindow.start,
          arrivalWindowStart: arrivalWindow.start,
          arrivalWindowEnd: arrivalWindow.end,
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
