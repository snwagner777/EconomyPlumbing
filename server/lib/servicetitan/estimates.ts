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

      const estimates = response.data.map((est: any) => {
        const normalized = {
          id: est.id,
          jobId: est.jobId,
          projectId: est.projectId,
          name: est.name || est.summary || `Estimate #${est.id}`,
          estimateNumber: est.estimateNumber || est.number || `EST-${est.id}`,
          summary: est.summary || est.name,
          jobNumber: est.jobNumber || est.job?.number,
          expiresOn: est.expiresOn || est.expirationDate,
          status: this.normalizeStatus(est.status),
          soldBy: est.soldBy,
          soldOn: est.soldOn,
          items: this.parseEstimateItems(est.items || []),
          subtotal: this.extractNumericValue(est.subtotal, `estimate[${est.id}].subtotal`),
          total: this.extractNumericValue(est.total, `estimate[${est.id}].total`),
          active: est.active ?? true,
          createdOn: est.createdOn,
          modifiedOn: est.modifiedOn,
          customerId: customerId,
        };

        // Validate top-level monetary fields
        if (typeof normalized.subtotal !== 'number' || !Number.isFinite(normalized.subtotal)) {
          console.error(`[ServiceTitan Estimates] Invalid subtotal for estimate ${est.id}:`, normalized.subtotal);
        }
        if (typeof normalized.total !== 'number' || !Number.isFinite(normalized.total)) {
          console.error(`[ServiceTitan Estimates] Invalid total for estimate ${est.id}:`, normalized.total);
        }

        return normalized;
      });

      return estimates;
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
        status: this.normalizeStatus(response.status),
        soldBy: response.soldBy,
        soldOn: response.soldOn,
        items: this.parseEstimateItems(response.items || []),
        subtotal: this.extractNumericValue(response.subtotal), // Extract from nested object
        total: this.extractNumericValue(response.total),       // Extract from nested object
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
   * Extract numeric value from potentially nested ServiceTitan monetary object
   * ServiceTitan can return:
   * - Flat: 100
   * - Single nest: { amount: 100 }
   * - Double nest: { amount: { value: 100 } }
   * - With unit: { unitPrice: 100 } or { unitPrice: { amount: 100 } }
   * 
   * VALIDATION: Returns 0 if extraction fails, logs warning if unexpected structure
   */
  private extractNumericValue(value: any, fieldContext?: string): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
      // Validate it's a finite number
      if (!Number.isFinite(value)) {
        console.warn(`[ServiceTitan Estimates] Non-finite number in ${fieldContext || 'monetary field'}:`, value);
        return 0;
      }
      return value;
    }
    if (typeof value !== 'object') return 0;

    // Try common ServiceTitan nested structures
    const attempts = [
      value.amount,
      value.unitPrice,
      value.total,
      value.value,
      value.price,
      value.unitCost,
    ];

    for (const attempt of attempts) {
      if (attempt !== null && attempt !== undefined) {
        // Recursively extract if still nested
        if (typeof attempt === 'number') {
          if (!Number.isFinite(attempt)) {
            console.warn(`[ServiceTitan Estimates] Non-finite number in ${fieldContext || 'nested monetary field'}:`, attempt);
            return 0;
          }
          return attempt;
        }
        if (typeof attempt === 'object') {
          return this.extractNumericValue(attempt, fieldContext);
        }
      }
    }

    // No valid numeric value found in nested structure
    console.warn(`[ServiceTitan Estimates] Could not extract numeric value from ${fieldContext || 'monetary field'}:`, JSON.stringify(value));
    return 0;
  }

  /**
   * Normalize ServiceTitan status to canonical values
   * ServiceTitan may return: "OPEN", "SOLD", "Dismissed", etc., or null/number
   * Frontend expects: "Open" | "Sold" | "Dismissed"
   */
  private normalizeStatus(status: string | undefined | null | number): 'Open' | 'Sold' | 'Dismissed' {
    if (!status || typeof status !== 'string') return 'Open';
    
    const statusUpper = status.toUpperCase();
    
    if (statusUpper === 'SOLD' || statusUpper.includes('SOLD')) {
      return 'Sold';
    }
    
    if (statusUpper === 'DISMISSED' || statusUpper.includes('DISMISS')) {
      return 'Dismissed';
    }
    
    // Default to Open for any other status (OPEN, PENDING, etc.)
    return 'Open';
  }

  /**
   * Parse estimate items from API response
   * Extracts soldHours from service items for scheduler integration
   * CRITICAL: ServiceTitan returns nested price objects, not flat numbers
   */
  private parseEstimateItems(items: any[]): EstimateItem[] {
    return items.map((item: any, index: number) => {
      const quantity = item.quantity || 1;
      
      // Use recursive extraction for all monetary fields with context
      const unitPrice = this.extractNumericValue(item.price, `item[${index}].price`);
      const itemTotal = this.extractNumericValue(item.total, `item[${index}].total`) || (unitPrice * quantity);
      const itemCost = this.extractNumericValue(item.cost, `item[${index}].cost`);
      const memberUnitPrice = item.memberPrice 
        ? this.extractNumericValue(item.memberPrice, `item[${index}].memberPrice`) 
        : undefined;

      const parsedItem = {
        id: item.id,
        type: item.type || 'Service',
        skuId: item.skuId || item.sku?.id,
        skuName: item.skuName || item.sku?.displayName || item.sku?.code || 'Unknown',
        description: item.description || item.sku?.description || '',
        quantity,
        cost: itemCost,
        price: unitPrice,
        total: itemTotal,
        memberPrice: memberUnitPrice,
        soldHours: item.soldHours || item.sku?.soldHours,
      };

      // Runtime validation - ensure all numbers are finite
      this.validateEstimateItem(parsedItem, index);

      return parsedItem;
    });
  }

  /**
   * Runtime validation for estimate items
   * Logs warnings if monetary fields are invalid
   */
  private validateEstimateItem(item: EstimateItem, index: number): void {
    const numericFields = ['cost', 'price', 'total', 'memberPrice'];
    
    for (const field of numericFields) {
      const value = (item as any)[field];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          console.error(
            `[ServiceTitan Estimates] VALIDATION FAILED: item[${index}].${field} is not a finite number:`,
            { itemId: item.id, field, value, type: typeof value }
          );
        }
      }
    }
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
