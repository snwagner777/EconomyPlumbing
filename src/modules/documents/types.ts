/**
 * TypeScript interfaces for invoices and estimates
 */

export interface Invoice {
  id: number;
  number: string;
  date: string;
  dueDate?: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  jobId?: number;
  jobNumber?: string;
  locationId?: number;
  customerId: number;
  summary?: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  type: string;
  skuName: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  memberPrice?: number;
}

export interface Estimate {
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

export interface EstimateDetail extends Estimate {
  soldHours: number; // For scheduler integration
}

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
  soldHours?: number;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EstimatesResponse {
  data: Estimate[];
  total: number;
  page: number;
  pageSize: number;
}
