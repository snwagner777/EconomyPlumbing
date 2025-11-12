/**
 * ServiceTitan Forms API - Forms and Submissions
 * 
 * MODULAR ARCHITECTURE - Use for marketing follow-ups, form data collection
 * Note: Job attachments are handled in jobs.ts (serviceTitanJobs.uploadJobAttachment)
 */

import { serviceTitanAuth } from './auth';

// Form Definition
export interface Form {
  id: number;
  active: boolean;
  name: string;
  published: boolean;
  hasConditionalLogic: boolean;
  hasTriggers: boolean;
  createdById: number;
  createdOn: string;
  modifiedOn: string;
}

// Form Submission
export interface FormSubmission {
  id: number;
  formId: number;
  formName: string;
  submittedOn: string;
  createdById: number;
  status: 'Started' | 'Completed';
  owners: Array<{
    type: 'Job' | 'Call' | 'Customer' | 'Location' | 'Equipment' | 'Technician' | 'JobAppointment' | 'Membership' | 'Truck';
    id: number;
  }>;
  units: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    comment?: string;
    units?: Array<{
      id: string;
      name: string;
      type: string;
      comment?: string;
      attachments?: Array<{
        fileName: string;
        createdFrom: string;
        originalFileName: string;
        thumbnail?: string;
      }>;
    }>;
  }>;
}

export class ServiceTitanForms {
  private readonly tenantId: string;
  private formsCache: { data: Form[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get all forms
   * MODULAR - Use to discover available forms for data collection
   */
  async getForms(options?: {
    status?: 'Published' | 'Unpublished' | 'Any';
    active?: boolean;
    hasConditionalLogic?: boolean;
    hasTriggers?: boolean;
    name?: string;
  }): Promise<Form[]> {
    // Check cache if no filters
    if (!options && this.formsCache && Date.now() - this.formsCache.timestamp < this.CACHE_TTL) {
      return this.formsCache.data;
    }

    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.active !== undefined) params.append('active', options.active ? 'True' : 'False');
      if (options?.hasConditionalLogic !== undefined) params.append('hasConditionalLogic', options.hasConditionalLogic.toString());
      if (options?.hasTriggers !== undefined) params.append('hasTriggers', options.hasTriggers.toString());
      if (options?.name) params.append('name', options.name);

      const queryString = params.toString();
      const url = `forms/v2/tenant/${this.tenantId}/forms${queryString ? `?${queryString}` : ''}`;

      const response = await serviceTitanAuth.makeRequest<{ data: Form[] }>(url);

      // Cache only if no filters
      if (!options) {
        this.formsCache = {
          data: response.data || [],
          timestamp: Date.now(),
        };
      }

      console.log(`[ServiceTitan Forms] Fetched ${response.data?.length || 0} forms`);
      return response.data || [];
    } catch (error) {
      console.error('[ServiceTitan Forms] Error fetching forms:', error);
      throw error;
    }
  }

  /**
   * Get form submissions
   * MODULAR - Use for marketing automation, follow-up campaigns
   * 
   * @param options - Filter options for submissions
   * @returns Array of form submissions
   */
  async getFormSubmissions(options?: {
    formIds?: number[]; // Filter by specific forms
    status?: 'Started' | 'Completed' | 'Any';
    active?: boolean;
    createdById?: number;
    submittedOnOrAfter?: Date;
    submittedBefore?: Date;
    ownerType?: 'Job' | 'Call' | 'Customer' | 'Location' | 'Equipment' | 'Technician' | 'JobAppointment' | 'Membership' | 'Truck';
    ownerIds?: number[]; // IDs of the owner objects (e.g., customer IDs)
    page?: number;
    pageSize?: number;
  }): Promise<FormSubmission[]> {
    try {
      const params = new URLSearchParams();
      if (options?.formIds) params.append('formIds', options.formIds.join(','));
      if (options?.status) params.append('status', options.status);
      if (options?.active !== undefined) params.append('active', options.active ? 'True' : 'False');
      if (options?.createdById) params.append('createdById', options.createdById.toString());
      if (options?.submittedOnOrAfter) params.append('submittedOnOrAfter', options.submittedOnOrAfter.toISOString());
      if (options?.submittedBefore) params.append('submittedBefore', options.submittedBefore.toISOString());
      if (options?.ownerType) params.append('ownerType', options.ownerType);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.pageSize) params.append('pageSize', options.pageSize.toString());

      const response = await serviceTitanAuth.makeRequest<{ data: FormSubmission[] }>(
        `forms/v2/tenant/${this.tenantId}/submissions?${params.toString()}`
      );

      console.log(`[ServiceTitan Forms] Fetched ${response.data?.length || 0} form submissions`);
      return response.data || [];
    } catch (error) {
      console.error('[ServiceTitan Forms] Error fetching form submissions:', error);
      throw error;
    }
  }

  /**
   * Get form submissions for a specific customer
   * MODULAR - Use in customer portal or marketing automation
   */
  async getCustomerFormSubmissions(customerId: number): Promise<FormSubmission[]> {
    return this.getFormSubmissions({
      ownerType: 'Customer',
      ownerIds: [customerId],
      status: 'Completed',
    });
  }

  /**
   * Get form submissions for a specific job
   * MODULAR - Use to retrieve job-related form data
   */
  async getJobFormSubmissions(jobId: number): Promise<FormSubmission[]> {
    return this.getFormSubmissions({
      ownerType: 'Job',
      ownerIds: [jobId],
      status: 'Completed',
    });
  }

  /**
   * Clear cached forms
   */
  clearCache(): void {
    this.formsCache = null;
  }
}

export const serviceTitanForms = new ServiceTitanForms();
