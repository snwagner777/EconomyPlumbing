/**
 * ServiceTitan Estimates API - Sales Estimates
 * 
 * Handles fetching estimates (sold and open) for customers.
 * Estimates contain pricebook items (services, materials, equipment).
 */

import { serviceTitanAuth } from './auth';

export interface EstimateItem {
  id: number;
  type: 'Service' | 'Material' | 'Equipment';
  skuId: number;
  skuName: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  total: number;
  memberPrice?: number;
  soldHours?: number; // For services - hours of work sold
}

export interface ServiceTitanEstimate {
  id: number;
  jobId?: number;
  projectId?: number;
  name: string;
  estimateNumber: string;
  summary?: string;
  jobNumber?: string;
  expiresOn?: string;
  status: 'Open' | 'Sold' | 'Dismissed';
  soldBy?: string;
  soldOn?: string;
  items: EstimateItem[];
  subtotal: number;
  total: number;
  active: boolean;
  createdOn: string;
  modifiedOn: string;
  customerId: number;
}

export class ServiceTitanEstimates {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get all estimates for a customer
   * @param customerId - Customer ID
   * @param includeInactive - Include dismissed/inactive estimates
   */
  async getEstimates(customerId: number, includeInactive = false): Promise<ServiceTitanEstimate[]> {
    try {
      console.log(`[ServiceTitan Estimates] Fetching estimates for customer ${customerId}`);
      
      const queryParams = new URLSearchParams({
        customerId: customerId.toString(),
        pageSize: '100',
        page: '1',
      });

      if (!includeInactive) {
        queryParams.append('active', 'true');
      }

      const response = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `sales/v2/tenant/${this.tenantId}/estimates?${queryParams.toString()}`
      );

      if (!response?.data) {
        console.log(`[ServiceTitan Estimates] No estimates found for customer ${customerId}`);
        return [];
      }

      console.log(`[ServiceTitan Estimates] Found ${response.data.length} estimates for customer ${customerId}`);

      return response.data.map((est: any) => ({
        id: est.id,
        jobId: est.jobId,
        projectId: est.projectId,
        name: est.name || est.summary || `Estimate #${est.id}`,
        estimateNumber: est.estimateNumber || est.number || `EST-${est.id}`,
        summary: est.summary || est.name,
        jobNumber: est.jobNumber || est.job?.number,
        expiresOn: est.expiresOn || est.expirationDate,
        status: est.status || 'Open',
        soldBy: est.soldBy,
        soldOn: est.soldOn,
        items: this.parseEstimateItems(est.items || []),
        subtotal: est.subtotal || 0,
        total: est.total || 0,
        active: est.active ?? true,
        createdOn: est.createdOn,
        modifiedOn: est.modifiedOn,
        customerId: customerId,
      }));
    } catch (error) {
      console.error(`[ServiceTitan Estimates] Error fetching estimates for customer ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Get a single estimate by ID
   * @param estimateId - Estimate ID
   */
  async getEstimateById(estimateId: number): Promise<ServiceTitanEstimate | null> {
    try {
      console.log(`[ServiceTitan Estimates] Fetching estimate ${estimateId}`);
      
      const response = await serviceTitanAuth.makeRequest<any>(
        `sales/v2/tenant/${this.tenantId}/estimates/${estimateId}`
      );

      if (!response) {
        console.log(`[ServiceTitan Estimates] Estimate ${estimateId} not found`);
        return null;
      }

      console.log(`[ServiceTitan Estimates] Retrieved estimate ${estimateId}`);

      return {
        id: response.id,
        jobId: response.jobId,
        projectId: response.projectId,
        name: response.name || response.summary || `Estimate #${response.id}`,
        estimateNumber: response.estimateNumber || response.number || `EST-${response.id}`,
        summary: response.summary || response.name,
        jobNumber: response.jobNumber || response.job?.number,
        expiresOn: response.expiresOn || response.expirationDate,
        status: response.status || 'Open',
        soldBy: response.soldBy,
        soldOn: response.soldOn,
        items: this.parseEstimateItems(response.items || []),
        subtotal: response.subtotal || 0,
        total: response.total || 0,
        active: response.active ?? true,
        createdOn: response.createdOn,
        modifiedOn: response.modifiedOn,
        customerId: response.customerId,
      };
    } catch (error) {
      console.error(`[ServiceTitan Estimates] Error fetching estimate ${estimateId}:`, error);
      return null;
    }
  }

  /**
   * Get sold estimates for a customer (for estimate-to-job conversion)
   * @param customerId - Customer ID
   */
  async getSoldEstimates(customerId: number): Promise<ServiceTitanEstimate[]> {
    try {
      console.log(`[ServiceTitan Estimates] Fetching sold estimates for customer ${customerId}`);
      
      const allEstimates = await this.getEstimates(customerId, false);
      const soldEstimates = allEstimates.filter(est => est.status === 'Sold');
      
      console.log(`[ServiceTitan Estimates] Found ${soldEstimates.length} sold estimates for customer ${customerId}`);
      
      return soldEstimates;
    } catch (error) {
      console.error(`[ServiceTitan Estimates] Error fetching sold estimates for customer ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Parse estimate items from API response
   * Extracts soldHours from service items for scheduler integration
   */
  private parseEstimateItems(items: any[]): EstimateItem[] {
    return items.map((item: any) => ({
      id: item.id,
      type: item.type || 'Service',
      skuId: item.skuId || item.sku?.id,
      skuName: item.skuName || item.sku?.displayName || item.sku?.code || 'Unknown',
      description: item.description || item.sku?.description || '',
      quantity: item.quantity || 1,
      cost: item.cost || 0,
      price: item.price || item.total || 0,
      total: item.total || (item.price * item.quantity) || 0,
      memberPrice: item.memberPrice,
      soldHours: item.soldHours || item.sku?.soldHours, // Critical for scheduler
    }));
  }

  /**
   * Calculate total soldHours from an estimate
   * Used for scheduler capacity validation (minimum 2 hours required)
   * @param estimate - Estimate object
   * @returns Total sold hours (can be any value: 0.25, 1.5, 6, etc.)
   */
  calculateSoldHours(estimate: ServiceTitanEstimate): number {
    return estimate.items
      .filter(item => item.type === 'Service' && item.soldHours)
      .reduce((total, item) => total + (item.soldHours! * item.quantity), 0);
  }

  /**
   * Enrich estimate items with pricebook details (images, etc.)
   * Used by API routes to attach pricebook metadata for UI display
   * @param estimates - Array of estimates to enrich
   * @returns Estimates with pricebook details attached to items
   */
  async enrichEstimatesWithPricebook(estimates: ServiceTitanEstimate[]): Promise<any[]> {
    const { serviceTitanPricebook } = await import('./pricebook');
    
    // Collect all unique pricebook items needed
    const pricebookRequests: Array<{ skuId: number; type: 'Material' | 'Equipment' | 'Service' }> = [];
    
    for (const estimate of estimates) {
      for (const item of estimate.items) {
        if (item.skuId && item.type) {
          pricebookRequests.push({ skuId: item.skuId, type: item.type });
        }
      }
    }
    
    // Batch fetch pricebook data
    const pricebookData = await serviceTitanPricebook.getPricebookItems(pricebookRequests);
    
    // Enrich each estimate with pricebook details
    return estimates.map(estimate => ({
      ...estimate,
      items: estimate.items.map(item => {
        const pricebookKey = `${item.type}-${item.skuId}`;
        const pricebookItem = pricebookData.get(pricebookKey);
        
        return {
          ...item,
          pricebookDetails: pricebookItem ? {
            imageUrl: pricebookItem.images[0]?.url || null,
            images: pricebookItem.images,
            description: pricebookItem.description,
            displayName: pricebookItem.displayName,
          } : null,
        };
      }),
    }));
  }
}

// Export singleton instance
export const serviceTitanEstimates = new ServiceTitanEstimates();
