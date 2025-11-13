/**
 * Customer Lookup Service
 * 
 * Centralized customer search orchestrator with pluggable adapters
 * Supports multiple data sources and search strategies
 */

import { XlsxLookupAdapter } from './XlsxLookupAdapter';
import { ServiceTitanLookupAdapter } from './ServiceTitanLookupAdapter';
import { CustomerLookupOptions, CustomerLookupResult, CustomerMatch } from './types';
import { isValidPhone, isValidEmail, scoreMatch } from './utils';

export class CustomerLookupService {
  private xlsxAdapter: XlsxLookupAdapter;
  private serviceTitanAdapter: ServiceTitanLookupAdapter;

  constructor() {
    this.xlsxAdapter = new XlsxLookupAdapter();
    this.serviceTitanAdapter = new ServiceTitanLookupAdapter();
  }

  /**
   * Search for customers using specified strategy
   */
  async search(options: CustomerLookupOptions): Promise<CustomerLookupResult> {
    const { phone, email, source, createPlaceholderIfMissing, includeInactive } = options;

    // Basic validation (relaxed to match existing behavior)
    if (!phone && !email) {
      throw new Error('Phone or email required for customer lookup');
    }

    // Validate formats but don't hard-reject
    if (phone && !isValidPhone(phone)) {
      console.warn(`[CustomerLookupService] Phone format unusual: ${phone}`);
    }

    if (email && !isValidEmail(email)) {
      console.warn(`[CustomerLookupService] Email format unusual: ${email}`);
    }

    console.log(`[CustomerLookupService] Starting search with source strategy: ${source}`);

    // Execute search based on source strategy
    switch (source) {
      case 'xlsx-only':
        return this.searchXlsxOnly({ phone, email, includeInactive });

      case 'servicetitan-only':
        return this.searchServiceTitanOnly({ phone, email, includeInactive, createPlaceholderIfMissing });

      case 'hybrid-prefer-xlsx':
        return this.searchHybridPreferXlsx({ phone, email, includeInactive, createPlaceholderIfMissing });

      case 'hybrid-prefer-servicetitan':
        return this.searchHybridPreferServiceTitan({ phone, email, includeInactive, createPlaceholderIfMissing });

      default:
        throw new Error(`Unknown lookup source: ${source}`);
    }
  }

  /**
   * Search XLSX database only (fastest, may be stale)
   */
  private async searchXlsxOnly(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
  }): Promise<CustomerLookupResult> {
    return this.xlsxAdapter.search(options);
  }

  /**
   * Search ServiceTitan only (authoritative, slower)
   */
  private async searchServiceTitanOnly(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
    createPlaceholderIfMissing?: boolean;
  }): Promise<CustomerLookupResult> {
    return this.serviceTitanAdapter.search(options);
  }

  /**
   * Hybrid search: Try XLSX first, fallback to ServiceTitan
   * Best for portal auth (fast path for known customers)
   */
  private async searchHybridPreferXlsx(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
    createPlaceholderIfMissing?: boolean;
  }): Promise<CustomerLookupResult> {
    console.log(`[CustomerLookupService] Hybrid search: trying XLSX first`);

    // Try XLSX first
    const xlsxResult = await this.xlsxAdapter.search(options);

    // If XLSX had an error, return it (don't fallback on errors)
    if (xlsxResult.error) {
      console.log(`[CustomerLookupService] XLSX adapter error, returning error: ${xlsxResult.error.message}`);
      return xlsxResult;
    }

    if (xlsxResult.found && xlsxResult.matches.length > 0) {
      console.log(`[CustomerLookupService] Found ${xlsxResult.matches.length} match(es) in XLSX`);
      return xlsxResult;
    }

    // Fallback to ServiceTitan (only if XLSX had no matches and no errors)
    console.log(`[CustomerLookupService] No XLSX matches, trying ServiceTitan`);
    return this.serviceTitanAdapter.search(options);
  }

  /**
   * Hybrid search: Try ServiceTitan first, fallback to XLSX
   * Best for public flows (authoritative source, with local fallback)
   */
  private async searchHybridPreferServiceTitan(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
    createPlaceholderIfMissing?: boolean;
  }): Promise<CustomerLookupResult> {
    console.log(`[CustomerLookupService] Hybrid search: trying ServiceTitan first`);

    // Try ServiceTitan first
    const stResult = await this.serviceTitanAdapter.search(options);

    // If ServiceTitan had an error, return it (don't fallback on errors)
    if (stResult.error) {
      console.log(`[CustomerLookupService] ServiceTitan adapter error, returning error: ${stResult.error.message}`);
      return stResult;
    }

    if (stResult.found && stResult.matches.length > 0) {
      console.log(`[CustomerLookupService] Found ${stResult.matches.length} match(es) in ServiceTitan`);
      return stResult;
    }

    // Fallback to XLSX (only if ServiceTitan had no matches and no errors)
    console.log(`[CustomerLookupService] No ServiceTitan matches, trying XLSX`);
    return this.xlsxAdapter.search({ phone: options.phone, email: options.email, includeInactive: options.includeInactive });
  }

  /**
   * Rank matches by quality (for multi-match scenarios)
   */
  rankMatches(matches: CustomerMatch[], searchCriteria: {
    phone?: string;
    email?: string;
  }): CustomerMatch[] {
    return matches
      .map((match) => ({
        match,
        score: scoreMatch(match, searchCriteria),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ match }) => match);
  }

  /**
   * Get best single match (auto-select if only one, or highest score)
   */
  getBestMatch(result: CustomerLookupResult, searchCriteria: {
    phone?: string;
    email?: string;
  }): CustomerMatch | null {
    if (!result.found || result.matches.length === 0) {
      return null;
    }

    if (result.matches.length === 1) {
      return result.matches[0];
    }

    // Multiple matches - return highest scored
    const ranked = this.rankMatches(result.matches, searchCriteria);
    return ranked[0];
  }
}
