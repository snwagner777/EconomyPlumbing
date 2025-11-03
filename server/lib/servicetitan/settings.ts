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
   * Check appointment availability for a specific time window
   */
  async checkAvailability(params: {
    businessUnitId: number;
    jobTypeId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<AvailabilitySlot[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        businessUnitIds: params.businessUnitId.toString(),
        jobTypeId: params.jobTypeId.toString(),
        arrivalWindowType: 'FourHour',
        includeTechnicianDetails: 'true',
      });

      const response = await serviceTitanAuth.makeRequest<CapacityResponse>(
        `dispatch/v2/tenant/${this.tenantId}/capacity?${queryParams.toString()}`
      );

      const slots = response.slots || response.data || [];
      console.log(`[ServiceTitan Settings] Found ${slots.length} availability slots`);
      return slots;
    } catch (error) {
      console.error('[ServiceTitan Settings] Error checking availability:', error);
      return [];
    }
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

    const allSlots = await this.checkAvailability({
      businessUnitId: params.businessUnitId,
      jobTypeId: params.jobTypeId,
      startDate: startOfDay,
      endDate: endOfDay,
    });

    // Filter to only available slots
    return allSlots.filter(slot => slot.isAvailable);
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
