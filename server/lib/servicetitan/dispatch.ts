/**
 * ServiceTitan Dispatch API - Zones
 * 
 * Fetches service zones for territory/route management
 */

import { serviceTitanAuth } from './auth';

export interface ServiceTitanZone {
  id: number;
  active: boolean;
  name: string;
  zips: string[];
  cities: string[];
  technicians: number[];
  createdOn: string;
  modifiedOn: string;
}

interface ZonesResponse {
  data: ServiceTitanZone[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalCount: number | null;
}

export class ServiceTitanDispatch {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get all zones from ServiceTitan Dispatch API
   * No caching - this is meant for daily sync jobs
   */
  async getZones(): Promise<ServiceTitanZone[]> {
    const accessToken = await serviceTitanAuth.getAccessToken();
    const url = `https://api.servicetitan.io/dispatch/v2/tenant/${this.tenantId}/zones`;

    console.log('[ServiceTitan Dispatch] Fetching zones...');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ST-App-Key': process.env.SERVICETITAN_APP_KEY || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ServiceTitan Dispatch API error (${response.status}): ${errorText}`);
    }

    const data: ZonesResponse = await response.json();
    
    console.log(`[ServiceTitan Dispatch] ✅ Fetched ${data.data.length} zones`);
    
    return data.data;
  }
}

export const serviceTitanDispatch = new ServiceTitanDispatch();
