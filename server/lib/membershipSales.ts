/**
 * Modular Membership Sales Helper
 * 
 * REUSABLE across scheduler, customer portal, admin, chatbot, etc.
 * Handles the complete membership sale flow:
 * - Customer/location creation in ServiceTitan
 * - Membership sale invoice creation
 * - Campaign resolution
 * - Error handling
 */

import { serviceTitanCRM } from './servicetitan/crm';
import { serviceTitanMemberships } from './servicetitan/memberships';
import { serviceTitanSettings } from './servicetitan/settings';
import { db } from '@/server/db';
import { trackingNumbers } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface CreateMembershipSaleRequest {
  // Customer info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Location info
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Membership details (from products table)
  saleTaskId: number;
  durationBillingId: number;
  membershipTypeId?: number; // Optional - for validation/logging
  
  // Business context
  businessUnitId?: number; // Optional - will use default if not provided
  utmSource?: string; // For campaign resolution
  
  // Payment context (optional - for logging/audit)
  paymentIntentId?: string;
  paymentAmount?: number; // in cents
  referralCode?: string;
}

export interface MembershipSaleResult {
  success: boolean;
  
  // ServiceTitan IDs
  customerId: number;
  locationId: number;
  invoiceId: number;
  customerMembershipId: number;
  
  // Additional context
  campaignId: number;
  businessUnitId: number;
  
  // Error info (if success = false)
  error?: string;
}

/**
 * MODULAR - Create a membership sale in ServiceTitan
 * 
 * Use this function from:
 * - Scheduler checkout completion
 * - Customer portal renewal
 * - Admin manual membership creation
 * - AI chatbot membership sales
 */
export async function createMembershipSale(
  request: CreateMembershipSaleRequest
): Promise<MembershipSaleResult> {
  try {
    // Step 1: Resolve campaign from UTM source or use default
    const campaignId = await resolveCampaignId(request.utmSource);
    
    // Step 2: Get business unit (use provided or default)
    let businessUnitId = request.businessUnitId;
    if (!businessUnitId) {
      const businessUnits = await serviceTitanSettings.getBusinessUnits();
      if (businessUnits.length === 0) {
        throw new Error('No active business units found in ServiceTitan');
      }
      businessUnitId = businessUnits[0].id;
    }
    
    console.log(`[Membership Sale] Creating for ${request.customerName}, businessUnit: ${businessUnitId}, campaign: ${campaignId}`);
    
    // Step 3: Ensure customer exists in ServiceTitan
    const customer = await serviceTitanCRM.ensureCustomer({
      name: request.customerName,
      phone: request.customerPhone,
      email: request.customerEmail,
      address: request.address,
    });
    
    console.log(`[Membership Sale] Customer resolved: ${customer.id}`);
    
    // Step 4: Ensure location exists for customer
    const location = await serviceTitanCRM.ensureLocation(customer.id, {
      customerId: customer.id,
      address: request.address,
      phone: request.customerPhone,
      email: request.customerEmail,
    });
    
    console.log(`[Membership Sale] Location resolved: ${location.id}`);
    
    // Step 5: Create membership sale invoice
    const membershipSale = await serviceTitanMemberships.createMembershipSale({
      customerId: customer.id,
      businessUnitId,
      saleTaskId: request.saleTaskId,
      durationBillingId: request.durationBillingId,
      locationId: location.id,
      recurringServiceAction: 'All',
    });
    
    console.log(`[Membership Sale] Success - Invoice: ${membershipSale.invoiceId}, Membership: ${membershipSale.customerMembershipId}`);
    
    // Log payment context if provided (for audit trail)
    if (request.paymentIntentId) {
      console.log(`[Membership Sale] Payment: ${request.paymentIntentId} ($${(request.paymentAmount || 0) / 100})`);
      if (request.referralCode) {
        console.log(`[Membership Sale] Referral code: ${request.referralCode}`);
      }
    }
    
    return {
      success: true,
      customerId: customer.id,
      locationId: location.id,
      invoiceId: membershipSale.invoiceId,
      customerMembershipId: membershipSale.customerMembershipId,
      campaignId,
      businessUnitId,
    };
  } catch (error: any) {
    console.error('[Membership Sale] Failed:', error);
    return {
      success: false,
      customerId: 0,
      locationId: 0,
      invoiceId: 0,
      customerMembershipId: 0,
      campaignId: 0,
      businessUnitId: 0,
      error: error.message || 'Failed to create membership sale',
    };
  }
}

/**
 * INTERNAL - Resolve campaign ID from UTM source or use default
 */
async function resolveCampaignId(utmSource?: string): Promise<number> {
  const source = utmSource || 'website';
  
  // Try tracking number mapping first
  const [trackingNumber] = await db.select()
    .from(trackingNumbers)
    .where(eq(trackingNumbers.channelKey, source))
    .limit(1);
  
  if (trackingNumber?.serviceTitanCampaignId) {
    console.log(`[Campaign Resolution] Found from tracking: ${trackingNumber.serviceTitanCampaignName || trackingNumber.channelName} (ID: ${trackingNumber.serviceTitanCampaignId})`);
    return trackingNumber.serviceTitanCampaignId;
  }
  
  // Fallback to default "website" campaign
  console.log(`[Campaign Resolution] No tracking mapping for "${source}", looking for default "website" campaign`);
  const campaigns = await serviceTitanSettings.getCampaigns();
  const websiteCampaign = campaigns.find(c => 
    c.name.toLowerCase() === 'website' || 
    c.source?.toLowerCase() === 'website'
  );
  
  if (!websiteCampaign) {
    throw new Error(
      `No ServiceTitan campaign found for utm_source="${source}". ` +
      `Please configure a tracking number mapping at /admin/tracking-numbers ` +
      `or create a "website" campaign in ServiceTitan as the default.`
    );
  }
  
  console.log(`[Campaign Resolution] Using default website campaign (ID: ${websiteCampaign.id})`);
  return websiteCampaign.id;
}
