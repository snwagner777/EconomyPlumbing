/**
 * ServiceTitan Settings API - Job Types, Business Units, Campaigns
 * 
 * Handles fetching and caching of reference data for scheduler configuration.
 */

import { serviceTitanAuth } from './auth';

interface JobType {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  defaultBusinessUnitId?: number;
  requiredSkills?: Array<{ id: number; name: string }>;
}

interface BusinessUnit {
  id: number;
  name: string;
  isActive: boolean;
  address?: {
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface Campaign {
  id: number;
  name: string;
  number: string;
  status: string;
  channel?: string;
  source?: string;
  externalId?: string;
}

interface AvailabilitySlot {
  start: string;
  end: string;
  isAvailable: boolean;
  availableCapacity?: number;
  totalCapacity?: number;
  technicianIds?: number[];
}

interface CapacityResponse {
  slots: AvailabilitySlot[];
  data?: AvailabilitySlot[];
}

export class ServiceTitanSettings {
  private readonly tenantId: string;
  
  // Caches with 6-hour TTL
  private jobTypesCache: { data: JobType[]; timestamp: number } | null = null;
  private businessUnitsCache: { data: BusinessUnit[]; timestamp: number } | null = null;
  private campaignsCache: { data: Campaign[]; timestamp: number } | null = null;
  private techniciansCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get all active job types (cached)
   */
  async getJobTypes(): Promise<JobType[]> {
    // Check cache
    if (this.jobTypesCache && Date.now() - this.jobTypesCache.timestamp < this.CACHE_TTL) {
      return this.jobTypesCache.data;
    }

    try {
      const response = await serviceTitanAuth.makeRequest<{ data: JobType[] }>(
        `jpm/v2/tenant/${this.tenantId}/job-types?active=True`
      );

      this.jobTypesCache = {
        data: response.data || [],
        timestamp: Date.now(),
      };

      console.log(`[ServiceTitan Settings] Cached ${this.jobTypesCache.data.length} job types`);
      return this.jobTypesCache.data;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error fetching job types:', error);
      // Return cached data if available, even if stale
      return this.jobTypesCache?.data || [];
    }
  }

  /**
   * Find job type by name (fuzzy match)
   */
  async findJobTypeByName(serviceName: string): Promise<JobType | null> {
    const jobTypes = await this.getJobTypes();
    const normalized = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Exact match first
    let match = jobTypes.find(jt => 
      jt.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    );

    // Fuzzy match if no exact match
    if (!match) {
      match = jobTypes.find(jt => {
        const jtNormalized = jt.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return jtNormalized.includes(normalized) || normalized.includes(jtNormalized);
      });
    }

    return match || null;
  }

  /**
   * Get all active business units (cached)
   */
  async getBusinessUnits(): Promise<BusinessUnit[]> {
    // Check cache
    if (this.businessUnitsCache && Date.now() - this.businessUnitsCache.timestamp < this.CACHE_TTL) {
      return this.businessUnitsCache.data;
    }

    try {
      const response = await serviceTitanAuth.makeRequest<{ data: BusinessUnit[] }>(
        `settings/v2/tenant/${this.tenantId}/business-units?isActive=true`
      );

      this.businessUnitsCache = {
        data: response.data || [],
        timestamp: Date.now(),
      };

      console.log(`[ServiceTitan Settings] Cached ${this.businessUnitsCache.data.length} business units`);
      return this.businessUnitsCache.data;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error fetching business units:', error);
      return this.businessUnitsCache?.data || [];
    }
  }

  /**
   * Get all active campaigns (cached)
   */
  async getCampaigns(): Promise<Campaign[]> {
    // Check cache
    if (this.campaignsCache && Date.now() - this.campaignsCache.timestamp < this.CACHE_TTL) {
      return this.campaignsCache.data;
    }

    try {
      const response = await serviceTitanAuth.makeRequest<{ data: Campaign[] }>(
        `marketing/v2/tenant/${this.tenantId}/campaigns?status=Active`
      );

      this.campaignsCache = {
        data: response.data || [],
        timestamp: Date.now(),
      };

      console.log(`[ServiceTitan Settings] Cached ${this.campaignsCache.data.length} campaigns`);
      return this.campaignsCache.data;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error fetching campaigns:', error);
      return this.campaignsCache?.data || [];
    }
  }

  /**
   * Find campaign by utm_source
   */
  async findCampaignByUtmSource(utmSource: string): Promise<Campaign | null> {
    const campaigns = await this.getCampaigns();
    
    // Try exact match on source field
    let match = campaigns.find(c => 
      c.source?.toLowerCase() === utmSource.toLowerCase()
    );

    // Try match on name or externalId
    if (!match) {
      match = campaigns.find(c => 
        c.name.toLowerCase().includes(utmSource.toLowerCase()) ||
        c.externalId?.toLowerCase() === utmSource.toLowerCase()
      );
    }

    return match || null;
  }

  /**
   * Get all active technicians/employees (cached)
   */
  async getTechnicians(): Promise<any[]> {
    // Check cache
    if (this.techniciansCache && Date.now() - this.techniciansCache.timestamp < this.CACHE_TTL) {
      return this.techniciansCache.data;
    }

    try {
      const response = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `settings/v2/tenant/${this.tenantId}/employees?active=true&pageSize=200`
      );

      this.techniciansCache = {
        data: response.data || [],
        timestamp: Date.now(),
      };

      console.log(`[ServiceTitan Settings] Cached ${this.techniciansCache.data.length} technicians`);
      return this.techniciansCache.data;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error fetching technicians:', error);
      return this.techniciansCache?.data || [];
    }
  }

  /**
   * Check appointment availability using ServiceTitan Capacity API
   * This API accounts for:
   * - Regular job appointments
   * - Non-job appointments (lunch, meetings, PTO)
   * - Technician availability and skills
   * - Business unit capacity
   */
  async checkCapacity(params: {
    businessUnitId: number;
    jobTypeId?: number;
    startDate: Date;
    endDate: Date;
    skillBasedAvailability?: boolean;
  }): Promise<AvailabilitySlot[]> {
    try {
      const requestBody = {
        startsOnOrAfter: params.startDate.toISOString(),
        endsOnOrBefore: params.endDate.toISOString(),
        businessUnitIds: [params.businessUnitId],
        jobTypeId: params.jobTypeId,
        skillBasedAvailability: params.skillBasedAvailability ?? true,
      };

      console.log(`[ServiceTitan Capacity] Checking capacity from ${params.startDate.toISOString()} to ${params.endDate.toISOString()}`);

      const response = await serviceTitanAuth.makeRequest<{
        timeStamp: string;
        availabilities: Array<{
          start: string;
          end: string;
          startUtc: string;
          endUtc: string;
          businessUnitIds: number[];
          totalAvailability: number;
          openAvailability: number;
          technicians: Array<{
            id: number;
            name: string;
            status: 'Available' | 'Unavailable';
            hasRequiredSkills?: boolean;
          }>;
          isAvailable: boolean;
          isExceedingIdealBookingPercentage: boolean;
        }>;
      }>(
        `dispatch/v2/tenant/${this.tenantId}/capacity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Convert ServiceTitan capacity response to our AvailabilitySlot format
      const slots = (response.availabilities || []).map(availability => {
        const hasCapacity = availability.openAvailability > 0;
        const stReportsAvailable = availability.isAvailable;
        const truelyAvailable = stReportsAvailable && hasCapacity;
        
        // Log any discrepancies where ST says available but openAvailability is 0
        if (stReportsAvailable && !hasCapacity) {
          console.warn(`[ServiceTitan Capacity] WARNING: Slot ${availability.start} marked isAvailable=true but openAvailability=${availability.openAvailability}`);
        }
        
        return {
          start: availability.startUtc,
          end: availability.endUtc,
          isAvailable: truelyAvailable,
          availableCapacity: availability.openAvailability,
          totalCapacity: availability.totalAvailability,
          technicianIds: availability.technicians
            .filter(tech => tech.status === 'Available')
            .map(tech => tech.id),
        };
      });

      console.log(`[ServiceTitan Capacity] Found ${slots.length} slots, ${slots.filter(s => s.isAvailable).length} available`);
      console.log(`[ServiceTitan Capacity] Breakdown: ${slots.filter(s => s.availableCapacity && s.availableCapacity > 0).length} with capacity, ${slots.filter(s => !s.availableCapacity || s.availableCapacity === 0).length} at zero capacity`);
      return slots;
    } catch (error) {
      console.error('[ServiceTitan Capacity] Error checking capacity:', error);
      return [];
    }
  }

  /**
   * @deprecated Use checkCapacity() instead - it accounts for non-job appointments
   */
  async checkAvailability(params: {
    businessUnitId: number;
    jobTypeId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<AvailabilitySlot[]> {
    return this.checkCapacity(params);
  }

  /**
   * Get available time slots for a specific day
   */
  async getAvailableSlotsForDay(params: {
    businessUnitId: number;
    jobTypeId: number;
    date: Date;
  }): Promise<AvailabilitySlot[]> {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(8, 0, 0, 0); // 8 AM

    const endOfDay = new Date(params.date);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    const allSlots = await this.checkCapacity({
      businessUnitId: params.businessUnitId,
      jobTypeId: params.jobTypeId,
      startDate: startOfDay,
      endDate: endOfDay,
      skillBasedAvailability: true,
    });

    // Filter to only available slots
    return allSlots.filter(slot => slot.isAvailable);
  }

  /**
   * Get arrival windows from ServiceTitan Settings
   * Returns actual arrival window configurations for scheduling
   */
  async getArrivalWindows(): Promise<Array<{ id: number; name: string; start: string; end: string; durationHours: number }>> {
    try {
      const response = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `settings/v2/tenant/${this.tenantId}/arrival-windows`
      );
      
      const windows = (response.data || []).map((window: any) => ({
        id: window.id,
        name: window.name || `${window.start} - ${window.end}`,
        start: window.start, // Format: "HH:mm" like "08:00"
        end: window.end,     // Format: "HH:mm" like "12:00"
        durationHours: this.calculateDuration(window.start, window.end),
      }));
      
      console.log(`[ServiceTitan Settings] Found ${windows.length} arrival windows from API`);
      return windows;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error fetching arrival windows:', error);
      // Fallback to common business hours windows
      console.log('[ServiceTitan Settings] Using fallback arrival windows');
      return [
        { id: 1, name: 'Morning', start: '08:00', end: '12:00', durationHours: 4 },
        { id: 2, name: 'Afternoon', start: '13:00', end: '17:00', durationHours: 4 },
      ];
    }
  }
  
  /**
   * Calculate duration in hours between two time strings
   */
  private calculateDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
  }

  /**
   * Clear all caches (for admin refresh)
   */
  clearCache(): void {
    this.jobTypesCache = null;
    this.businessUnitsCache = null;
    this.campaignsCache = null;
    console.log('[ServiceTitan Settings] All caches cleared');
  }
}

export const serviceTitanSettings = new ServiceTitanSettings();
