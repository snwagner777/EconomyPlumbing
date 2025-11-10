import { serviceTitanAuth } from './auth';
import { serviceTitanJobs } from './jobs';
import pLimit from 'p-limit';

interface CustomerPortalDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  locations: LocationSummary[];
  referrals: PortalReferral[];
  credits: number;
}

interface LocationSummary {
  id: number;
  name: string;
  address: string;
}

interface PortalLocationDetails {
  id: number;
  name: string;
  address: string;
  appointments: PortalAppointment[];
  invoices: PortalInvoice[];
  memberships: PortalMembership[];
}

interface PortalAppointment {
  id: number;
  jobId: number;
  serviceName: string;
  start: string;
  end: string;
  status: string;
  arrivalWindow?: string;
  technicianName?: string;
  locationName?: string;
}

interface PortalInvoice {
  id: number;
  number: string;
  date: string;
  total: number;
  paid: boolean;
  balance: number;
}

interface PortalMembership {
  id: number;
  name: string;
  status: string;
  startDate: string;
  expiryDate?: string;
}

interface PortalReferral {
  id: number;
  refereeName: string;
  refereePhone: string;
  status: string;
  createdAt: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ServiceTitanPortalService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_CONCURRENT = 5;
  private readonly limit = pLimit(5); // Concurrency limiter

  /**
   * Get or set cache entry
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Invalidate cache for a customer
   */
  invalidateCustomerCache(customerId: number): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`customer:${customerId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[PortalService] Invalidated ${keysToDelete.length} cache entries for customer ${customerId}`);
  }

  /**
   * Fetch complete customer portal data
   */
  async getCustomerPortalData(customerId: number): Promise<CustomerPortalDTO> {
    const cacheKey = `customer:${customerId}:portal-data`;
    
    // Check cache first
    const cached = this.getCached<CustomerPortalDTO>(cacheKey);
    if (cached) {
      console.log(`[PortalService] Cache hit for customer ${customerId}`);
      return cached;
    }

    console.log(`[PortalService] Fetching fresh data for customer ${customerId}`);

    try {
      const tenantId = serviceTitanAuth.getTenantId();

      // Fetch customer details first
      const customer = await serviceTitanAuth.makeRequest<any>(
        `crm/v2/tenant/${tenantId}/customers/${customerId}`
      );

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Fetch locations and location-independent data in parallel
      const [locations, referrals] = await Promise.all([
        this.fetchLocations(customerId),
        this.fetchReferrals(customerId),
      ]);

      const portalData: CustomerPortalDTO = {
        id: customer.id,
        name: customer.name || 'Customer',
        email: customer.email || '',
        phone: customer.phoneNumber || '',
        address: this.formatAddress(customer.address),
        locations,
        referrals,
        credits: 0, // TODO: Fetch from referral credits system
      };

      // Cache the result
      this.setCache(cacheKey, portalData);

      return portalData;
    } catch (error: any) {
      console.error(`[PortalService] Error fetching customer ${customerId} data:`, error);
      throw new Error(`Failed to load customer data: ${error.message}`);
    }
  }

  /**
   * Fetch lightweight location summaries (no nested data)
   */
  private async fetchLocations(customerId: number): Promise<LocationSummary[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      // Fetch all locations for this customer
      const locationsResponse = await serviceTitanAuth.makeRequest<any>(
        `crm/v2/tenant/${tenantId}/locations?customerId=${customerId}&active=true&pageSize=100`
      );

      if (!locationsResponse?.data || locationsResponse.data.length === 0) {
        // No locations - return default primary location
        return [{
          id: 0,
          name: 'Primary Location',
          address: '',
        }];
      }

      // Map to lightweight summaries only
      return locationsResponse.data.map((location: any) => ({
        id: location.id,
        name: location.name || this.formatAddress(location.address) || 'Unnamed Location',
        address: this.formatAddress(location.address),
      }));
    } catch (error: any) {
      console.error('[PortalService] Error fetching locations:', error);
      // Fallback to default location
      return [{
        id: 0,
        name: 'Primary Location',
        address: '',
      }];
    }
  }

  /**
   * Fetch complete details for a specific location (for lazy loading)
   */
  async getLocationDetails(customerId: number, locationId: number): Promise<PortalLocationDetails> {
    const cacheKey = `customer:${customerId}:location:${locationId}:details`;
    
    // Check cache first
    const cached = this.getCached<PortalLocationDetails>(cacheKey);
    if (cached) {
      console.log(`[PortalService] Cache hit for customer ${customerId} location ${locationId}`);
      return cached;
    }

    console.log(`[PortalService] Fetching location ${locationId} details for customer ${customerId}`);

    try {
      const tenantId = serviceTitanAuth.getTenantId();

      // SECURITY: Verify location belongs to this customer
      // Fetch location and validate ownership in one call
      let locationName = 'Primary Location';
      let locationAddress = '';

      if (locationId !== 0) {
        const location = await serviceTitanAuth.makeRequest<any>(
          `crm/v2/tenant/${tenantId}/locations/${locationId}`
        );
        
        if (!location) {
          throw new Error('Location not found');
        }

        // SECURITY: Verify this location belongs to the requested customer
        if (location.customerId !== customerId) {
          console.error(`[PortalService] SECURITY VIOLATION: Customer ${customerId} attempted to access location ${locationId} which belongs to customer ${location.customerId}`);
          throw new Error('Unauthorized - Location does not belong to this customer');
        }
        
        locationName = location.name || this.formatAddress(location.address) || 'Unnamed Location';
        locationAddress = this.formatAddress(location.address);
      }

      // Fetch all data for this location in parallel
      const [appointments, invoices, memberships] = await Promise.all([
        locationId === 0
          ? this.fetchAppointments(customerId)
          : this.fetchAppointmentsByLocation(customerId, locationId),
        locationId === 0
          ? this.fetchInvoices(customerId)
          : this.fetchInvoicesByLocation(customerId, locationId),
        locationId === 0
          ? this.fetchMemberships(customerId)
          : this.fetchMembershipsByLocation(customerId, locationId),
      ]);

      const locationDetails: PortalLocationDetails = {
        id: locationId,
        name: locationName,
        address: locationAddress,
        appointments,
        invoices,
        memberships,
      };

      // Cache the result
      this.setCache(cacheKey, locationDetails);

      return locationDetails;
    } catch (error: any) {
      console.error(`[PortalService] Error fetching location ${locationId} details:`, error);
      throw new Error(`Failed to load location details: ${error.message}`);
    }
  }

  /**
   * Fetch appointments for a customer by location
   */
  private async fetchAppointmentsByLocation(customerId: number, locationId: number): Promise<PortalAppointment[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      // Get jobs for this customer at this location
      const jobsResponse = await serviceTitanAuth.makeRequest<any>(
        `jpm/v2/tenant/${tenantId}/jobs?customerId=${customerId}&locationId=${locationId}&active=Any&pageSize=100`
      );

      if (!jobsResponse?.data || jobsResponse.data.length === 0) {
        return [];
      }

      // Fetch appointments for each job with concurrency limiting
      const appointmentPromises = jobsResponse.data.map((job: any) => 
        this.limit(async () => {
          try {
            const appointmentsResponse = await serviceTitanAuth.makeRequest<any>(
              `jpm/v2/tenant/${tenantId}/appointments?jobId=${job.id}`
            );

            if (!appointmentsResponse?.data) return [];

            return appointmentsResponse.data
              .filter((apt: any) => {
                const validStatuses = ['Scheduled', 'Dispatched', 'Working', 'OnMyWay'];
                return validStatuses.includes(apt.status);
              })
              .map((apt: any) => ({
                id: apt.id,
                jobId: job.id,
                serviceName: job.businessUnit?.name || job.jobType?.name || 'Service',
                start: apt.start,
                end: apt.end,
                status: apt.status,
                arrivalWindow: apt.arrivalWindowStart && apt.arrivalWindowEnd
                  ? `${new Date(apt.arrivalWindowStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(apt.arrivalWindowEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                  : undefined,
                technicianName: apt.technician?.name,
                locationName: job.location?.name,
              }));
          } catch (error) {
            console.error(`[PortalService] Error fetching appointments for job ${job.id}:`, error);
            return [];
          }
        })
      );

      const appointmentsArrays = await Promise.all(appointmentPromises);
      return appointmentsArrays.flat();
    } catch (error: any) {
      console.error(`[PortalService] Error fetching appointments for location ${locationId}:`, error);
      return [];
    }
  }

  /**
   * Fetch invoices for a customer by location
   */
  private async fetchInvoicesByLocation(customerId: number, locationId: number): Promise<PortalInvoice[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      const invoicesResponse = await serviceTitanAuth.makeRequest<any>(
        `accounting/v2/tenant/${tenantId}/invoices?customerId=${customerId}&locationId=${locationId}&pageSize=50`
      );

      if (!invoicesResponse?.data) return [];

      return invoicesResponse.data
        .map((inv: any) => ({
          id: inv.id,
          number: inv.invoiceNumber || inv.number || `INV-${inv.id}`,
          date: inv.createdOn || inv.invoiceDate,
          total: inv.total || 0,
          paid: inv.balance === 0,
          balance: inv.balance || 0,
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    } catch (error: any) {
      console.error(`[PortalService] Error fetching invoices for location ${locationId}:`, error);
      return [];
    }
  }

  /**
   * Fetch memberships for a customer by location
   */
  private async fetchMembershipsByLocation(customerId: number, locationId: number): Promise<PortalMembership[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      const membershipsResponse = await serviceTitanAuth.makeRequest<any>(
        `memberships/v2/tenant/${tenantId}/memberships?customerId=${customerId}&locationId=${locationId}`
      );

      if (!membershipsResponse?.data) return [];

      return membershipsResponse.data.map((mem: any) => ({
        id: mem.id,
        name: mem.type?.name || 'Membership',
        status: mem.status,
        startDate: mem.from,
        expiryDate: mem.to,
      }));
    } catch (error: any) {
      console.error(`[PortalService] Error fetching memberships for location ${locationId}:`, error);
      return [];
    }
  }

  /**
   * Fetch appointments for a customer (all locations)
   */
  private async fetchAppointments(customerId: number): Promise<PortalAppointment[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      // Get jobs for this customer
      const jobsResponse = await serviceTitanAuth.makeRequest<any>(
        `jpm/v2/tenant/${tenantId}/jobs?customerId=${customerId}&active=Any&pageSize=100`
      );

      if (!jobsResponse?.data || jobsResponse.data.length === 0) {
        return [];
      }

      // Fetch appointments for each job with concurrency limiting
      const appointmentPromises = jobsResponse.data.map((job: any) =>
        this.limit(async () => {
          try {
            const appointmentsResponse = await serviceTitanAuth.makeRequest<any>(
              `jpm/v2/tenant/${tenantId}/appointments?jobId=${job.id}`
            );

            if (!appointmentsResponse?.data) return [];

            return appointmentsResponse.data
              .filter((apt: any) => {
                // Only show upcoming and scheduled appointments
                const validStatuses = ['Scheduled', 'Dispatched', 'Working', 'OnMyWay'];
                return validStatuses.includes(apt.status);
              })
              .map((apt: any) => ({
                id: apt.id,
                jobId: job.id,
                serviceName: job.businessUnit?.name || job.jobType?.name || 'Service',
                start: apt.start,
                end: apt.end,
                status: apt.status,
                arrivalWindow: apt.arrivalWindowStart && apt.arrivalWindowEnd
                  ? `${new Date(apt.arrivalWindowStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(apt.arrivalWindowEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                  : undefined,
                technicianName: apt.technician?.name,
                locationName: job.location?.name,
              }));
          } catch (error) {
            console.error(`[PortalService] Error fetching appointments for job ${job.id}:`, error);
            return [];
          }
        })
      );

      const appointmentsArrays = await Promise.all(appointmentPromises);
      return appointmentsArrays.flat();
    } catch (error: any) {
      console.error('[PortalService] Error fetching appointments:', error);
      return [];
    }
  }

  /**
   * Fetch invoices for a customer
   */
  private async fetchInvoices(customerId: number): Promise<PortalInvoice[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      const invoicesResponse = await serviceTitanAuth.makeRequest<any>(
        `accounting/v2/tenant/${tenantId}/invoices?customerId=${customerId}&pageSize=50`
      );

      if (!invoicesResponse?.data) return [];

      return invoicesResponse.data
        .map((inv: any) => ({
          id: inv.id,
          number: inv.invoiceNumber || inv.number || `INV-${inv.id}`,
          date: inv.createdOn || inv.invoiceDate,
          total: inv.total || 0,
          paid: inv.balance === 0,
          balance: inv.balance || 0,
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Limit to 10 most recent
    } catch (error: any) {
      console.error('[PortalService] Error fetching invoices:', error);
      return [];
    }
  }

  /**
   * Fetch memberships for a customer
   */
  private async fetchMemberships(customerId: number): Promise<PortalMembership[]> {
    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      const membershipsResponse = await serviceTitanAuth.makeRequest<any>(
        `memberships/v2/tenant/${tenantId}/memberships?customerId=${customerId}`
      );

      if (!membershipsResponse?.data) return [];

      return membershipsResponse.data.map((mem: any) => ({
        id: mem.id,
        name: mem.type?.name || 'Membership',
        status: mem.status,
        startDate: mem.from,
        expiryDate: mem.to,
      }));
    } catch (error: any) {
      console.error('[PortalService] Error fetching memberships:', error);
      return [];
    }
  }

  /**
   * Fetch referrals from local database (not ServiceTitan)
   */
  private async fetchReferrals(customerId: number): Promise<PortalReferral[]> {
    try {
      const { db } = await import('@/server/db');
      const { referrals } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');

      const referralRecords = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerCustomerId, customerId))
        .orderBy(desc(referrals.submittedAt))
        .limit(20);

      return referralRecords.map((ref, index) => ({
        id: index + 1, // Use index as numeric ID since DB uses string UUID
        refereeName: ref.refereeName,
        refereePhone: ref.refereePhone,
        status: ref.status,
        createdAt: ref.submittedAt.toISOString(),
      }));
    } catch (error: any) {
      console.error('[PortalService] Error fetching referrals:', error);
      return [];
    }
  }

  /**
   * Fetch recent jobs for portal "Recent Work" section
   */
  async getRecentJobs(customerId: number, limit: number = 10): Promise<any[]> {
    const cacheKey = `customer:${customerId}:recent-jobs`;
    
    // Check cache
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tenantId = serviceTitanAuth.getTenantId();
      
      // Get completed jobs from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const jobsResponse = await serviceTitanAuth.makeRequest<any>(
        `jpm/v2/tenant/${tenantId}/jobs?customerId=${customerId}&completedAfter=${sixMonthsAgo.toISOString()}&pageSize=${limit}`
      );

      if (!jobsResponse?.data) return [];

      const jobs = jobsResponse.data
        .filter((job: any) => job.completedOn) // Only completed jobs
        .map((job: any) => ({
          id: job.id,
          jobNumber: job.jobNumber,
          serviceName: job.businessUnit?.name || job.jobType?.name || 'Service',
          completionDate: job.completedOn,
          total: job.total || 0,
          locationName: job.location?.name,
        }))
        .sort((a: any, b: any) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

      // Cache the result
      this.setCache(cacheKey, jobs);

      return jobs;
    } catch (error: any) {
      console.error('[PortalService] Error fetching recent jobs:', error);
      return [];
    }
  }

  /**
   * Helper to format address
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    
    const parts = [
      address.street,
      address.unit,
      address.city,
      address.state,
      address.zip,
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

// Export singleton instance
export const serviceTitanPortalService = new ServiceTitanPortalService();
