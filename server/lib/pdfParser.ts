/**
 * ServiceTitan PDF Parser
 * 
 * Extracts structured data from ServiceTitan invoice and estimate PDFs.
 * Uses pattern matching to find:
 * - Customer name, email, phone
 * - Invoice/Estimate number
 * - Amount/Total
 * - Date
 * - Service details
 */

// pdf-parse is a CommonJS module, need to use require
const pdfParse = require('pdf-parse');

export interface ParsedPDFData {
  // Customer information
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  
  // Document information
  documentNumber: string | null; // Invoice or Estimate number
  documentType: 'invoice' | 'estimate';
  documentDate: Date | null;
  
  // Financial information
  totalAmount: number | null; // In cents
  subtotal: number | null; // In cents
  tax: number | null; // In cents
  
  // Service details
  serviceDescription: string | null;
  services: Array<{
    description: string;
    amount: number; // In cents
  }>;
  
  // Technician/job info
  technicianName: string | null;
  jobNotes: string | null;
  
  // Parsing metadata
  rawText: string;
  confidence: number; // 0-100
  extractionErrors: string[];
}

/**
 * Parse a ServiceTitan PDF buffer and extract structured data
 */
export async function parsePDF(
  pdfBuffer: Buffer,
  documentType: 'invoice' | 'estimate'
): Promise<ParsedPDFData> {
  const errors: string[] = [];
  
  try {
    // Parse PDF buffer to extract text
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    // Extract customer information
    const customerName = extractCustomerName(text, errors);
    const customerEmail = extractEmail(text, errors);
    const customerPhone = extractPhone(text, errors);
    
    // Extract document information
    const documentNumber = extractDocumentNumber(text, documentType, errors);
    const documentDate = extractDate(text, errors);
    
    // Extract financial information
    const totalAmount = extractTotalAmount(text, errors);
    const subtotal = extractSubtotal(text, errors);
    const tax = extractTax(text, errors);
    
    // Extract service details
    const services = extractServices(text, errors);
    const serviceDescription = services.map(s => s.description).join(', ') || null;
    
    // Extract technician info
    const technicianName = extractTechnicianName(text, errors);
    const jobNotes = extractJobNotes(text, errors);
    
    // Calculate confidence score
    const confidence = calculateConfidence({
      customerName,
      customerEmail,
      customerPhone,
      documentNumber,
      totalAmount,
    });
    
    return {
      customerName,
      customerEmail,
      customerPhone,
      documentNumber,
      documentType,
      documentDate,
      totalAmount,
      subtotal,
      tax,
      serviceDescription,
      services,
      technicianName,
      jobNotes,
      rawText: text,
      confidence,
      extractionErrors: errors,
    };
  } catch (error: any) {
    errors.push(`PDF parsing failed: ${error.message}`);
    
    return {
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      documentNumber: null,
      documentType,
      documentDate: null,
      totalAmount: null,
      subtotal: null,
      tax: null,
      serviceDescription: null,
      services: [],
      technicianName: null,
      jobNotes: null,
      rawText: '',
      confidence: 0,
      extractionErrors: errors,
    };
  }
}

/**
 * Extract customer name from PDF text
 * Looks for patterns like "Customer: John Doe" or "Bill To: John Doe"
 */
function extractCustomerName(text: string, errors: string[]): string | null {
  const patterns = [
    /Customer:\s*(.+?)(?:\n|$)/i,
    /Bill To:\s*(.+?)(?:\n|$)/i,
    /Name:\s*(.+?)(?:\n|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  errors.push('Customer name not found');
  return null;
}

/**
 * Extract email address from PDF text
 */
function extractEmail(text: string, errors: string[]): string | null {
  // Match email addresses
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailPattern);
  
  if (match) {
    return match[0];
  }
  
  errors.push('Email address not found');
  return null;
}

/**
 * Extract phone number from PDF text
 * Normalizes to format: (XXX) XXX-XXXX
 */
function extractPhone(text: string, errors: string[]): string | null {
  // Match phone numbers in various formats
  const phonePattern = /(?:Phone|Tel|Mobile)?:?\s*(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/i;
  const match = text.match(phonePattern);
  
  if (match) {
    // Normalize to (XXX) XXX-XXXX format
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  errors.push('Phone number not found');
  return null;
}

/**
 * Extract invoice or estimate number
 */
function extractDocumentNumber(
  text: string,
  documentType: 'invoice' | 'estimate',
  errors: string[]
): string | null {
  const label = documentType === 'invoice' ? 'Invoice' : 'Estimate';
  const patterns = [
    new RegExp(`${label}\\s*#?:?\\s*([A-Z0-9-]+)`, 'i'),
    new RegExp(`${label}\\s*Number:?\\s*([A-Z0-9-]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  errors.push(`${label} number not found`);
  return null;
}

/**
 * Extract document date
 */
function extractDate(text: string, errors: string[]): Date | null {
  // Match date patterns: MM/DD/YYYY, Month DD, YYYY, etc.
  const datePatterns = [
    /Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  errors.push('Document date not found');
  return null;
}

/**
 * Extract total amount (in cents)
 */
function extractTotalAmount(text: string, errors: string[]): number | null {
  const totalPatterns = [
    /Total:?\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /Amount Due:?\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /Grand Total:?\s*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount)) {
        return Math.round(amount * 100); // Convert to cents
      }
    }
  }
  
  errors.push('Total amount not found');
  return null;
}

/**
 * Extract subtotal (in cents)
 */
function extractSubtotal(text: string, errors: string[]): number | null {
  const subtotalPattern = /Subtotal:?\s*\$?\s*([\d,]+\.?\d{0,2})/i;
  const match = text.match(subtotalPattern);
  
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(amount)) {
      return Math.round(amount * 100); // Convert to cents
    }
  }
  
  return null; // Subtotal is optional
}

/**
 * Extract tax amount (in cents)
 */
function extractTax(text: string, errors: string[]): number | null {
  const taxPattern = /Tax:?\s*\$?\s*([\d,]+\.?\d{0,2})/i;
  const match = text.match(taxPattern);
  
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(amount)) {
      return Math.round(amount * 100); // Convert to cents
    }
  }
  
  return null; // Tax is optional
}

/**
 * Extract individual services with amounts
 */
function extractServices(text: string, errors: string[]): Array<{ description: string; amount: number }> {
  // TODO: Implement service line item extraction
  // This is complex and depends on ServiceTitan PDF format
  // May need to parse table-like structures
  
  return [];
}

/**
 * Extract technician name
 */
function extractTechnicianName(text: string, errors: string[]): string | null {
  const techPatterns = [
    /Technician:\s*(.+?)(?:\n|$)/i,
    /Tech:\s*(.+?)(?:\n|$)/i,
    /Performed By:\s*(.+?)(?:\n|$)/i,
  ];
  
  for (const pattern of techPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  return null; // Technician is optional
}

/**
 * Extract job notes
 */
function extractJobNotes(text: string, errors: string[]): string | null {
  const notesPatterns = [
    /Notes:\s*([\s\S]+?)(?:\n\n|$)/i,
    /Comments:\s*([\s\S]+?)(?:\n\n|$)/i,
    /Description:\s*([\s\S]+?)(?:\n\n|$)/i,
  ];
  
  for (const pattern of notesPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  return null; // Notes are optional
}

/**
 * Calculate confidence score based on extracted fields
 * Returns 0-100
 */
function calculateConfidence(data: {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  documentNumber: string | null;
  totalAmount: number | null;
}): number {
  let score = 0;
  const weights = {
    customerName: 25,
    customerEmail: 15,
    customerPhone: 15,
    documentNumber: 20,
    totalAmount: 25,
  };
  
  if (data.customerName) score += weights.customerName;
  if (data.customerEmail) score += weights.customerEmail;
  if (data.customerPhone) score += weights.customerPhone;
  if (data.documentNumber) score += weights.documentNumber;
  if (data.totalAmount) score += weights.totalAmount;
  
  return score;
}

/**
 * Normalize phone number to database format
 * Input: Various formats like (512) 555-1234, 512-555-1234, 5125551234
 * Output: (512) 555-1234
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove leading 1 if present (US country code)
  const cleaned = digits.startsWith('1') ? digits.substring(1) : digits;
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
}
