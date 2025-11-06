import QRCode from 'qrcode';
import { db } from '../db';
import { vouchers, referrals } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique voucher code
 * Format: REF-XXXXXXXX (8 random alphanumeric characters)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (I, O, 0, 1, L)
  let code = 'REF-';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate QR code as base64 data URL
 */
async function generateQRCode(code: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Create a new voucher with QR code
 */
export async function createVoucher(params: {
  voucherType: 'referral_new_customer' | 'referral_reward' | 'promotional';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: number;
  referralId?: string;
  referrerCustomerId?: number;
  discountAmount?: number; // in cents, defaults to $25
  minimumJobAmount?: number; // in cents, defaults to $200
}): Promise<{ id: string; code: string; qrCode: string; expiresAt: Date }> {
  // Generate unique code
  let code = generateVoucherCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure code is unique
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, code))
      .limit(1);
    
    if (existing.length === 0) break;
    
    code = generateVoucherCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique voucher code');
  }
  
  // Generate QR code
  const qrCode = await generateQRCode(code);
  
  // Calculate expiration (6 months from now)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);
  
  // Create voucher
  const [voucher] = await db
    .insert(vouchers)
    .values({
      code,
      qrCode,
      voucherType: params.voucherType,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerId: params.customerId,
      referralId: params.referralId,
      referrerCustomerId: params.referrerCustomerId,
      discountAmount: params.discountAmount ?? 2500, // Default $25
      minimumJobAmount: params.minimumJobAmount ?? 20000, // Default $200
      expiresAt,
      status: 'active',
    })
    .returning();
  
  return {
    id: voucher.id,
    code: voucher.code,
    qrCode: voucher.qrCode,
    expiresAt: voucher.expiresAt,
  };
}

/**
 * Create vouchers for a new referral:
 * 1. Voucher for the referee (new customer) - immediate
 * 2. Placeholder for referrer reward - created when referee voucher is redeemed
 */
export async function createReferralVouchers(params: {
  referralId: string;
  refereeName: string;
  refereeEmail?: string;
  refereePhone?: string;
  referrerCustomerId: number;
  referrerName: string;
}): Promise<{ refereeVoucher: { id: string; code: string; qrCode: string; expiresAt: Date } }> {
  // Create immediate voucher for referee
  const refereeVoucher = await createVoucher({
    voucherType: 'referral_new_customer',
    customerName: params.refereeName,
    customerEmail: params.refereeEmail,
    customerPhone: params.refereePhone,
    referralId: params.referralId,
    referrerCustomerId: params.referrerCustomerId,
  });
  
  return { refereeVoucher };
}

/**
 * Redeem a voucher
 */
export async function redeemVoucher(params: {
  code: string;
  technicianName: string;
  jobId: string;
  jobNumber: string;
  jobAmount: number; // in cents
}): Promise<{
  success: boolean;
  message: string;
  discountAmount?: number;
  referrerRewardVoucher?: { id: string; code: string; qrCode: string };
}> {
  // Find voucher
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.code, params.code))
    .limit(1);
  
  if (!voucher) {
    return { success: false, message: 'Voucher not found' };
  }
  
  // Check if already redeemed
  if (voucher.status === 'redeemed') {
    return { success: false, message: 'Voucher already redeemed' };
  }
  
  // Check if expired
  if (voucher.status === 'expired' || new Date() > voucher.expiresAt) {
    return { success: false, message: 'Voucher has expired' };
  }
  
  // Check minimum job amount
  if (params.jobAmount < voucher.minimumJobAmount) {
    const minAmount = (voucher.minimumJobAmount / 100).toFixed(2);
    return { 
      success: false, 
      message: `Job amount must be at least $${minAmount} to use this voucher` 
    };
  }
  
  // Redeem voucher
  await db
    .update(vouchers)
    .set({
      status: 'redeemed',
      redeemedAt: new Date(),
      redeemedBy: params.technicianName,
      redeemedJobId: params.jobId,
      redeemedJobNumber: params.jobNumber,
      redeemedJobAmount: params.jobAmount,
      updatedAt: new Date(),
    })
    .where(eq(vouchers.id, voucher.id));
  
  // If this is a referral voucher, create reward voucher for the referrer
  let referrerRewardVoucher;
  if (voucher.voucherType === 'referral_new_customer' && voucher.referrerCustomerId) {
    // Get referrer info from the referral
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, voucher.referralId!))
      .limit(1);
    
    if (referral) {
      // Create reward voucher for referrer
      const reward = await createVoucher({
        voucherType: 'referral_reward',
        customerName: referral.referrerName,
        customerEmail: referral.referrerEmail,
        customerPhone: referral.referrerPhone,
        customerId: voucher.referrerCustomerId,
        referralId: voucher.referralId,
        discountAmount: 2500, // $25 reward
        minimumJobAmount: 20000, // $200 minimum
      });
      
      referrerRewardVoucher = reward;
      
      // Update referral status
      await db
        .update(referrals)
        .set({
          status: 'credited',
          creditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, voucher.referralId!));
    }
  }
  
  return {
    success: true,
    message: 'Voucher redeemed successfully',
    discountAmount: voucher.discountAmount,
    referrerRewardVoucher,
  };
}

/**
 * Get all vouchers for a customer
 */
export async function getCustomerVouchers(customerId: number) {
  const customerVouchers = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.customerId, customerId))
    .orderBy(vouchers.createdAt);
  
  // Mark expired vouchers
  const now = new Date();
  for (const voucher of customerVouchers) {
    if (voucher.status === 'active' && voucher.expiresAt < now) {
      await db
        .update(vouchers)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(vouchers.id, voucher.id));
      
      voucher.status = 'expired';
    }
  }
  
  return customerVouchers;
}

/**
 * Get voucher totals for a customer
 */
export async function getCustomerVoucherTotals(customerId: number) {
  const customerVouchers = await getCustomerVouchers(customerId);
  
  const active = customerVouchers.filter(v => v.status === 'active');
  const totalValue = active.reduce((sum, v) => sum + v.discountAmount, 0);
  
  return {
    activeCount: active.length,
    totalValue, // in cents
    totalValueFormatted: `$${(totalValue / 100).toFixed(0)}`,
    vouchers: customerVouchers,
  };
}
