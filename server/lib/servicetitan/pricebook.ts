/**
 * ServiceTitan Pricebook API - Materials, Equipment, Services
 * 
 * Handles fetching pricebook items with images for display in estimates/invoices.
 */

import { serviceTitanAuth } from './auth';

export interface PricebookImage {
  url: string;
  description?: string;
}

export interface PricebookItem {
  id: number;
  type: 'Material' | 'Equipment' | 'Service';
  code: string;
  displayName: string;
  description: string;
  cost: number;
  price: number;
  memberPrice?: number;
  images: PricebookImage[];
  active: boolean;
  soldHours?: number; // For services
}

export class ServiceTitanPricebook {
  private readonly tenantId: string;
  private cache: Map<string, { item: PricebookItem; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get a pricebook item (material, equipment, or service) by SKU ID and type
   * @param skuId - Pricebook item ID
   * @param type - Item type (Material, Equipment, Service)
   */
  async getPricebookItem(skuId: number, type: 'Material' | 'Equipment' | 'Service'): Promise<PricebookItem | null> {
    try {
      const cacheKey = `${type}-${skuId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`[ServiceTitan Pricebook] Cache hit for ${type} ${skuId}`);
        return cached.item;
      }

      console.log(`[ServiceTitan Pricebook] Fetching ${type} ${skuId}`);
      
      const endpoint = this.getEndpointForType(type);
      const response = await serviceTitanAuth.makeRequest<any>(
        `pricebook/v2/tenant/${this.tenantId}/${endpoint}/${skuId}`
      );

      if (!response) {
        console.log(`[ServiceTitan Pricebook] ${type} ${skuId} not found`);
        return null;
      }

      const item: PricebookItem = {
        id: response.id,
        type: type,
        code: response.code || response.displayName,
        displayName: response.displayName || response.code || `${type} #${response.id}`,
        description: response.description || '',
        cost: response.cost || 0,
        price: response.price || 0,
        memberPrice: response.memberPrice,
        images: this.parseImages(response.images || response.imageUrls || []),
        active: response.active ?? true,
        soldHours: response.soldHours, // Services only
      };

      // Cache the result
      this.cache.set(cacheKey, { item, timestamp: Date.now() });
      
      console.log(`[ServiceTitan Pricebook] Retrieved ${type} ${skuId}: ${item.displayName} (${item.images.length} images)`);
      
      return item;
    } catch (error) {
      console.error(`[ServiceTitan Pricebook] Error fetching ${type} ${skuId}:`, error);
      return null;
    }
  }

  /**
   * Get multiple pricebook items in batch (with caching)
   * @param items - Array of {skuId, type} objects
   */
  async getPricebookItems(items: Array<{ skuId: number; type: 'Material' | 'Equipment' | 'Service' }>): Promise<Map<string, PricebookItem>> {
    const results = new Map<string, PricebookItem>();
    
    for (const { skuId, type } of items) {
      const item = await this.getPricebookItem(skuId, type);
      if (item) {
        results.set(`${type}-${skuId}`, item);
      }
    }
    
    return results;
  }

  /**
   * Clear the pricebook cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[ServiceTitan Pricebook] Cache cleared');
  }

  /**
   * Get the API endpoint suffix for the item type
   */
  private getEndpointForType(type: 'Material' | 'Equipment' | 'Service'): string {
    switch (type) {
      case 'Material':
        return 'materials';
      case 'Equipment':
        return 'equipment';
      case 'Service':
        return 'services';
    }
  }

  /**
   * Parse image URLs from API response
   * ServiceTitan stores images as internal file paths or URLs
   */
  private parseImages(imageData: any): PricebookImage[] {
    if (!imageData) return [];
    
    if (Array.isArray(imageData)) {
      return imageData
        .filter(img => img && (img.url || img.imageUrl))
        .map(img => ({
          url: img.url || img.imageUrl,
          description: img.description || img.alt,
        }));
    }
    
    // Single image object
    if (typeof imageData === 'object' && (imageData.url || imageData.imageUrl)) {
      return [{
        url: imageData.url || imageData.imageUrl,
        description: imageData.description || imageData.alt,
      }];
    }
    
    // String URL
    if (typeof imageData === 'string') {
      return [{ url: imageData }];
    }
    
    return [];
  }
}

// Export singleton instance
export const serviceTitanPricebook = new ServiceTitanPricebook();
