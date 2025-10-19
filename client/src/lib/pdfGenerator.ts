import jsPDF from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  total: number;
  balance: number;
  status: string;
  createdOn: string;
  dueDate?: string;
  jobNumber?: string;
  summary?: string;
}

interface EstimateData {
  estimateNumber: string;
  total: number;
  status: string;
  createdOn: string;
  expiresOn?: string;
  jobNumber?: string;
  summary: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Add company header to PDF
 */
function addCompanyHeader(doc: jsPDF) {
  // Company name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Economy Plumbing Services', 20, 25);
  
  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Austin & Marble Falls, Texas', 20, 32);
  doc.text('Phone: (512) 396-7811', 20, 37);
  doc.text('www.economyplumbingservices.com', 20, 42);
  
  // Add separator line
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);
}

/**
 * Add customer info section
 */
function addCustomerInfo(doc: jsPDF, customer: CustomerInfo, yPosition: number) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPosition);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = yPosition + 6;
  
  doc.text(customer.name, 20, y);
  y += 5;
  
  if (customer.address) {
    doc.text(customer.address.street, 20, y);
    y += 5;
    doc.text(`${customer.address.city}, ${customer.address.state} ${customer.address.zip}`, 20, y);
    y += 5;
  }
  
  if (customer.phoneNumber) {
    doc.text(`Phone: ${customer.phoneNumber}`, 20, y);
    y += 5;
  }
  
  if (customer.email) {
    doc.text(`Email: ${customer.email}`, 20, y);
    y += 5;
  }
  
  return y;
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(
  invoice: InvoiceData,
  customer: CustomerInfo
): void {
  const doc = new jsPDF();
  
  // Add header
  addCompanyHeader(doc);
  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 25);
  
  // Invoice details (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 32);
  doc.text(`Date: ${formatDate(invoice.createdOn)}`, 150, 37);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 150, 42);
  }
  if (invoice.jobNumber) {
    doc.text(`Job #: ${invoice.jobNumber}`, 150, 47);
  }
  
  // Customer info
  const nextY = addCustomerInfo(doc, customer, 60);
  
  // Service description
  let y = nextY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 6;
  
  if (invoice.summary) {
    const lines = doc.splitTextToSize(invoice.summary, 170);
    doc.text(lines, 20, y);
    y += (lines.length * 5) + 5;
  } else {
    doc.text('Plumbing services as provided', 20, y);
    y += 10;
  }
  
  // Amount section
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 120, y);
  doc.text(formatCurrency(invoice.total), 170, y, { align: 'right' });
  
  if (invoice.balance > 0) {
    y += 8;
    doc.setTextColor(200, 0, 0); // Red for balance due
    doc.text('Balance Due:', 120, y);
    doc.text(formatCurrency(invoice.balance), 170, y, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
  }
  
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  
  // Status badge
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusText = `Status: ${invoice.status}`;
  if (invoice.status === 'Paid') {
    doc.setTextColor(0, 150, 0);
  } else if (invoice.status === 'Open' || invoice.status === 'Pending') {
    doc.setTextColor(200, 100, 0);
  }
  doc.text(statusText, 20, y);
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing Economy Plumbing Services!', 105, 270, { align: 'center' });
  doc.text('For questions about this invoice, please call (512) 396-7811', 105, 275, { align: 'center' });
  
  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

/**
 * Generate Estimate PDF
 */
export function generateEstimatePDF(
  estimate: EstimateData,
  customer: CustomerInfo
): void {
  const doc = new jsPDF();
  
  // Add header
  addCompanyHeader(doc);
  
  // Estimate title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE', 150, 25);
  
  // Estimate details (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estimate #: ${estimate.estimateNumber}`, 150, 32);
  doc.text(`Date: ${formatDate(estimate.createdOn)}`, 150, 37);
  if (estimate.expiresOn) {
    doc.text(`Expires: ${formatDate(estimate.expiresOn)}`, 150, 42);
  }
  if (estimate.jobNumber) {
    doc.text(`Job #: ${estimate.jobNumber}`, 150, 47);
  }
  
  // Customer info
  const nextY = addCustomerInfo(doc, customer, 60);
  
  // Service description
  let y = nextY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposed Work:', 20, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 6;
  
  const lines = doc.splitTextToSize(estimate.summary, 170);
  doc.text(lines, 20, y);
  y += (lines.length * 5) + 5;
  
  // Estimated amount section
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Total:', 120, y);
  doc.setTextColor(0, 100, 200); // Blue for estimate
  doc.text(formatCurrency(estimate.total), 170, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  
  // Status
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 100, 0);
  doc.text(`Status: ${estimate.status}`, 20, y);
  doc.setTextColor(0, 0, 0);
  
  // Note about estimate
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an estimate. Final costs may vary based on actual work performed.', 20, y);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for considering Economy Plumbing Services!', 105, 270, { align: 'center' });
  doc.text('Questions? Call us at (512) 396-7811', 105, 275, { align: 'center' });
  
  // Save the PDF
  doc.save(`Estimate-${estimate.estimateNumber}.pdf`);
}
