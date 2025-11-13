/**
 * Customer Lookup Service - Main Export
 * 
 * Centralized customer search with multiple data source strategies
 */

export { CustomerLookupService } from './CustomerLookupService';
export { XlsxLookupAdapter } from './XlsxLookupAdapter';
export { ServiceTitanLookupAdapter } from './ServiceTitanLookupAdapter';
export * from './types';
export * from './utils';

// Export singleton instance for easy consumption
import { CustomerLookupService } from './CustomerLookupService';
export const customerLookupService = new CustomerLookupService();
